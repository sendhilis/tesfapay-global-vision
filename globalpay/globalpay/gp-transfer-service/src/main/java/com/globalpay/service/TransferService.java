package com.globalpay.service;

import com.globalpay.client.*;
import com.globalpay.exception.*;
import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransferRepository      transferRepository;
    private final MoneyRequestRepository  moneyRequestRepository;
    private final ContactRepository       contactRepository;
    private final WalletClientInternal    walletClient;
    private final UserClient              userClient;
    private final KafkaTemplate<String, Object> kafka;

    @Value("${transfer.fee.p2p-flat-etb:2.50}")
    private BigDecimal p2pFee;

    @Value("${transfer.fee.daily-limit-level1:25000.00}")
    private BigDecimal dailyLimitLevel1;

    @Value("${transfer.fee.daily-limit-level2:50000.00}")
    private BigDecimal dailyLimitLevel2;

    private static final BigDecimal POINTS_PER_ETB = new BigDecimal("0.1");

    // ── Send Money (P2P Saga) ────────────────────────────────────

    @Transactional
    public SendMoneyResponse send(UUID senderUserId, String senderWalletId,
                                  int senderKycLevel, SendMoneyRequest req) {

        // 1. Idempotency check
        if (req.getIdempotencyKey() != null) {
            Optional<Transfer> existing = transferRepository.findByIdempotencyKey(req.getIdempotencyKey());
            if (existing.isPresent()) {
                Transfer t = existing.get();
                return toSendResponse(t);
            }
        }

        // 2. Validate daily limit
        BigDecimal sentToday = transferRepository.sumSentSince(senderUserId,
                Instant.now().truncatedTo(ChronoUnit.DAYS));
        BigDecimal limit = senderKycLevel >= 2 ? dailyLimitLevel2 : dailyLimitLevel1;
        BigDecimal wouldBe = sentToday.add(req.getAmount()).add(p2pFee);
        if (wouldBe.compareTo(limit) > 0) {
            throw new DailyLimitExceededException(
                    String.format("Daily limit of ETB %.2f would be exceeded. Sent today: ETB %.2f",
                            limit, sentToday));
        }

        // 3. Look up recipient
        var recipientResp = userClient.findByPhone(req.getRecipientPhone());
        if (recipientResp == null || !recipientResp.hasBody() || recipientResp.getBody() == null) {
            throw new RecipientNotFoundException("Recipient phone not registered: " + req.getRecipientPhone());
        }
        UserDto recipient = recipientResp.getBody();

        // 4. Prevent self-transfer
        if (senderUserId.toString().equals(recipient.getId())) {
            throw new IllegalArgumentException("Cannot transfer money to yourself");
        }

        BigDecimal totalDeduction = req.getAmount().add(p2pFee);
        String ref = generateRef("TXN");

        // 5. Create pending transfer record
        Transfer transfer = Transfer.builder()
                .reference(ref)
                .senderUserId(senderUserId)
                .senderWalletId(senderWalletId)
                .recipientUserId(UUID.fromString(recipient.getId()))
                .recipientWalletId(recipient.getWalletId())
                .recipientPhone(req.getRecipientPhone())
                .recipientName(recipient.getFullName())
                .amount(req.getAmount())
                .fee(p2pFee)
                .totalDeducted(totalDeduction)
                .note(req.getNote())
                .status("PENDING")
                .idempotencyKey(req.getIdempotencyKey())
                .build();

        transferRepository.save(transfer);

        // 6. Saga Step 1 — Debit sender
        WalletOpResponse debitResp;
        try {
            debitResp = walletClient.debit(WalletOpRequest.of(
                    senderUserId, totalDeduction, "P2P_SEND",
                    ref, recipient.getFullName(), req.getNote(),
                    req.getIdempotencyKey()
            )).getBody();
        } catch (Exception e) {
            transfer.setStatus("FAILED");
            transferRepository.save(transfer);
            log.error("Debit failed for transfer {}: {}", ref, e.getMessage());
            throw new RuntimeException("Transfer failed: could not debit sender wallet");
        }

        // 7. Saga Step 2 — Credit recipient
        try {
            walletClient.credit(WalletOpRequest.of(
                    UUID.fromString(recipient.getId()), req.getAmount(), "P2P_RECEIVE",
                    ref, getSenderDisplayName(senderUserId), req.getNote(),
                    req.getIdempotencyKey() != null ? req.getIdempotencyKey() + "_credit" : null
            ));
        } catch (Exception e) {
            // Saga compensation — refund sender
            log.error("Credit failed for transfer {}, compensating sender: {}", ref, e.getMessage());
            try {
                walletClient.credit(WalletOpRequest.of(
                        senderUserId, totalDeduction, "REVERSAL",
                        generateRef("REV"), "Refund: " + ref, "Transfer failed", null
                ));
            } catch (Exception refundEx) {
                log.error("CRITICAL: Refund also failed for transfer {}! Manual intervention needed.", ref);
            }
            transfer.setStatus("FAILED");
            transferRepository.save(transfer);
            throw new RuntimeException("Transfer failed: could not credit recipient");
        }

        // 8. Mark completed
        int loyaltyPoints = req.getAmount().multiply(POINTS_PER_ETB).intValue();
        transfer.setStatus("COMPLETED");
        transfer.setLoyaltyPointsEarned(loyaltyPoints);
        transfer.setBalanceAfter(debitResp != null ? debitResp.getNewBalance() : null);
        transfer.setCompletedAt(Instant.now());
        if (debitResp != null) transfer.setWalletTxnId(debitResp.getTransactionId());
        transferRepository.save(transfer);

        // 9. Save as contact / update favourite
        upsertContact(senderUserId, recipient);

        // 10. Publish Kafka event
        publishTransferEvent(transfer, recipient);

        log.info("P2P transfer COMPLETED: ref={} from={} to={} amount={}",
                ref, senderUserId, recipient.getId(), req.getAmount());

        return toSendResponse(transfer);
    }

    // ── Request Money ────────────────────────────────────────────

    @Transactional
    public MoneyRequestResponse requestMoney(UUID requesterId, String requesterPhone,
                                              RequestMoneyRequest req) {
        String ref = generateRef("REQ");

        // Resolve target user (may or may not exist yet)
        UUID targetUserId = null;
        String targetName = req.getFromPhone();
        try {
            var resp = userClient.findByPhone(req.getFromPhone());
            if (resp != null && resp.hasBody() && resp.getBody() != null) {
                targetUserId = UUID.fromString(resp.getBody().getId());
                targetName   = resp.getBody().getFullName();
            }
        } catch (Exception ignored) { /* non-blocking — target may not be registered */ }

        MoneyRequest moneyRequest = MoneyRequest.builder()
                .reference(ref)
                .requesterId(requesterId)
                .requesterPhone(requesterPhone)
                .targetPhone(req.getFromPhone())
                .targetUserId(targetUserId)
                .amount(req.getAmount())
                .note(req.getNote())
                .status("PENDING")
                .expiresAt(Instant.now().plus(3, ChronoUnit.DAYS))
                .build();

        moneyRequestRepository.save(moneyRequest);

        // Notify target via Kafka (notification service will send push/SMS)
        publishMoneyRequestEvent(moneyRequest, targetName);

        return toRequestResponse(moneyRequest, null, targetName);
    }

    // ── List Pending Requests ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MoneyRequestResponse> getPendingRequests(UUID userId, String direction) {
        List<MoneyRequest> requests;
        if ("outgoing".equalsIgnoreCase(direction)) {
            requests = moneyRequestRepository
                    .findByRequesterIdAndStatusOrderByCreatedAtDesc(userId, "PENDING", Pageable.unpaged())
                    .getContent();
        } else {
            requests = moneyRequestRepository
                    .findByTargetUserIdAndStatusOrderByCreatedAtDesc(userId, "PENDING", Pageable.unpaged())
                    .getContent();
        }
        return requests.stream()
                .map(r -> toRequestResponse(r, null, null))
                .collect(Collectors.toList());
    }

    // ── Respond to Request ───────────────────────────────────────

    @Transactional
    public MoneyRequestResponse respondToRequest(UUID targetUserId, String targetWalletId,
                                                  int kycLevel, UUID requestId,
                                                  RespondToRequestRequest req) {
        MoneyRequest request = moneyRequestRepository.findById(requestId)
                .orElseThrow(() -> new MoneyRequestNotFoundException("Request not found: " + requestId));

        if (!"PENDING".equals(request.getStatus())) {
            throw new MoneyRequestNotFoundException("Request is no longer pending: " + requestId);
        }
        if (request.getExpiresAt().isBefore(Instant.now())) {
            request.setStatus("EXPIRED");
            moneyRequestRepository.save(request);
            throw new MoneyRequestNotFoundException("Money request has expired");
        }

        if ("DECLINE".equals(req.getAction())) {
            request.setStatus("DECLINED");
            request.setRespondedAt(Instant.now());
            moneyRequestRepository.save(request);
            return toRequestResponse(request, null, null);
        }

        // ACCEPT — execute the transfer from target → requester
        SendMoneyRequest sendReq = new SendMoneyRequest();
        sendReq.setRecipientPhone(request.getRequesterPhone());
        sendReq.setAmount(request.getAmount());
        sendReq.setNote("Payment for: " + (request.getNote() != null ? request.getNote() : request.getReference()));
        sendReq.setPin(req.getPin());

        SendMoneyResponse sendResp = send(targetUserId, targetWalletId, kycLevel, sendReq);

        request.setStatus("ACCEPTED");
        request.setRespondedAt(Instant.now());
        moneyRequestRepository.save(request);

        return toRequestResponse(request, sendResp.getTransactionId(), null);
    }

    // ── Contacts ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ContactResponse> getContacts(UUID userId) {
        return contactRepository
                .findByOwnerUserIdOrderByFavoriteDescContactNameAsc(userId)
                .stream()
                .map(this::toContactResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContactLookupResponse lookupContact(String phone) {
        try {
            var resp = userClient.findByPhone(phone);
            if (resp != null && resp.hasBody() && resp.getBody() != null) {
                UserDto user = resp.getBody();
                return ContactLookupResponse.builder()
                        .found(true)
                        .name(user.getFullName())
                        .avatarInitials(initials(user.getFirstName(), user.getLastName()))
                        .walletId(user.getWalletId())
                        .build();
            }
        } catch (Exception ignored) {}
        return ContactLookupResponse.builder().found(false).build();
    }

    // ── Fee Preview ──────────────────────────────────────────────

    public FeeLookupResponse feePreview(BigDecimal amount) {
        return FeeLookupResponse.builder()
                .amount(amount)
                .fee(p2pFee)
                .totalDeducted(amount.add(p2pFee))
                .currency("ETB")
                .build();
    }

    // ── Scheduled: expire stale requests ────────────────────────

    @Scheduled(fixedDelay = 600_000)
    @Transactional
    public void expireRequests() {
        int n = moneyRequestRepository.expireOldRequests(Instant.now());
        if (n > 0) log.info("Expired {} money requests", n);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private void upsertContact(UUID ownerId, UserDto recipient) {
        contactRepository.findByOwnerUserIdAndContactPhone(ownerId, recipient.getPhone())
                .ifPresentOrElse(c -> {
                    c.setGlobalpayUser(true);
                    contactRepository.save(c);
                }, () -> contactRepository.save(Contact.builder()
                        .ownerUserId(ownerId)
                        .contactUserId(UUID.fromString(recipient.getId()))
                        .contactName(recipient.getFullName())
                        .contactPhone(recipient.getPhone())
                        .globalpayUser(true)
                        .favorite(false)
                        .build())
                );
    }

    private String getSenderDisplayName(UUID senderUserId) {
        try {
            var r = userClient.findById(senderUserId.toString());
            if (r != null && r.hasBody() && r.getBody() != null) return r.getBody().getFullName();
        } catch (Exception ignored) {}
        return "GlobalPay User";
    }

    private void publishTransferEvent(Transfer t, UserDto recipient) {
        try {
            kafka.send("transfer.completed", t.getId().toString(), Map.of(
                    "eventId",       UUID.randomUUID().toString(),
                    "transactionId", t.getId().toString(),
                    "reference",     t.getReference(),
                    "type",          "P2P_SEND",
                    "senderId",      t.getSenderUserId().toString(),
                    "recipientId",   t.getRecipientUserId().toString(),
                    "amount",        t.getAmount().toPlainString(),
                    "fee",           t.getFee().toPlainString(),
                    "currency",      "ETB",
                    "timestamp",     Instant.now().toString()
            ));
        } catch (Exception e) {
            log.error("Failed to publish transfer event {}: {}", t.getReference(), e.getMessage());
        }
    }

    private void publishMoneyRequestEvent(MoneyRequest r, String targetName) {
        try {
            kafka.send("money.request.created", r.getId().toString(), Map.of(
                    "requestId",   r.getId().toString(),
                    "reference",   r.getReference(),
                    "requesterId", r.getRequesterId().toString(),
                    "targetPhone", r.getTargetPhone(),
                    "amount",      r.getAmount().toPlainString(),
                    "note",        r.getNote() != null ? r.getNote() : "",
                    "timestamp",   Instant.now().toString()
            ));
        } catch (Exception e) {
            log.error("Failed to publish money request event: {}", e.getMessage());
        }
    }

    private String generateRef(String prefix) {
        return String.format("%s%tY%<tm%<td%05d", prefix, new java.util.Date(),
                (int)(Math.random() * 99999));
    }

    private String initials(String first, String last) {
        String f = (first != null && !first.isEmpty()) ? String.valueOf(first.charAt(0)).toUpperCase() : "";
        String l = (last  != null && !last.isEmpty())  ? String.valueOf(last.charAt(0)).toUpperCase()  : "";
        return f + l;
    }

    private SendMoneyResponse toSendResponse(Transfer t) {
        return SendMoneyResponse.builder()
                .transactionId(t.getId())
                .reference(t.getReference())
                .amount(t.getAmount())
                .fee(t.getFee())
                .totalDeducted(t.getTotalDeducted())
                .recipientName(t.getRecipientName())
                .status(t.getStatus())
                .loyaltyPointsEarned(t.getLoyaltyPointsEarned())
                .newBalance(t.getBalanceAfter())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private MoneyRequestResponse toRequestResponse(MoneyRequest r, UUID txnId, String targetName) {
        return MoneyRequestResponse.builder()
                .requestId(r.getId())
                .reference(r.getReference())
                .fromUser(targetName != null ? targetName : r.getTargetPhone())
                .toUser(r.getRequesterName() != null ? r.getRequesterName() : r.getRequesterPhone())
                .amount(r.getAmount())
                .note(r.getNote())
                .status(r.getStatus())
                .expiresAt(r.getExpiresAt())
                .createdAt(r.getCreatedAt())
                .transactionId(txnId)
                .build();
    }

    private ContactResponse toContactResponse(Contact c) {
        String[] parts = c.getContactName().split(" ", 2);
        String first = parts.length > 0 ? parts[0] : "";
        String last  = parts.length > 1 ? parts[1] : "";
        return ContactResponse.builder()
                .id(c.getId())
                .name(c.getContactName())
                .phone(c.getContactPhone())
                .avatarInitials(initials(first, last))
                .isFavorite(c.isFavorite())
                .isGlobalPayUser(c.isGlobalpayUser())
                .build();
    }
}
