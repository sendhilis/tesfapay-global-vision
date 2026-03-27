package com.globalpay.service;

import com.globalpay.event.TransactionCompletedEvent;
import com.globalpay.exception.*;
import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.model.entity.*;
import com.globalpay.model.enums.TransactionType;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository       walletRepository;
    private final TransactionRepository  transactionRepository;
    private final MoneyRequestRepository moneyRequestRepository;
    private final LedgerService          ledgerService;
    private final ReferenceGenerator     referenceGenerator;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    // Points: 0.1 points per ETB transacted
    private static final BigDecimal POINTS_PER_ETB   = new BigDecimal("0.1");
    private static final BigDecimal POINT_VALUE_ETB  = new BigDecimal("0.05");

    // ── Create Wallet ────────────────────────────────────────────

    @Transactional
    public Wallet createWallet(CreateWalletRequest req) {
        walletRepository.findByUserId(req.getUserId()).ifPresent(w -> {
            throw new DuplicateTransactionException("Wallet already exists for user: " + req.getUserId());
        });

        Wallet wallet = Wallet.builder()
                .userId(req.getUserId())
                .walletId(req.getWalletId())
                .mainBalance(BigDecimal.ZERO)
                .savingsBalance(BigDecimal.ZERO)
                .loanBalance(BigDecimal.ZERO)
                .currency(req.getCurrency() != null ? req.getCurrency() : "ETB")
                .locked(false)
                .build();

        return walletRepository.save(wallet);
    }

    // ── Balance ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BalanceResponse getBalance(UUID userId) {
        Wallet wallet = getWalletOrThrow(userId);

        // Loyalty points are managed by loyalty-service, approximated here
        int loyaltyPoints = 0; // fetched via Feign in full integration

        return BalanceResponse.builder()
                .mainBalance(wallet.getMainBalance())
                .savingsBalance(wallet.getSavingsBalance())
                .loanBalance(wallet.getLoanBalance())
                .loyaltyPoints(loyaltyPoints)
                .loyaltyPointsValue(BigDecimal.valueOf(loyaltyPoints).multiply(POINT_VALUE_ETB))
                .currency(wallet.getCurrency())
                .lastUpdated(wallet.getUpdatedAt())
                .build();
    }

    // ── Dashboard Summary ────────────────────────────────────────

    @Transactional(readOnly = true)
    public WalletSummaryResponse getSummary(UUID userId) {
        Instant startOfDay  = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant startOfWeek = Instant.now().minus(7, ChronoUnit.DAYS);

        BigDecimal todayIn    = transactionRepository.sumCreditsSince(userId, startOfDay);
        BigDecimal todayOut   = transactionRepository.sumDebitsSince(userId, startOfDay);
        BigDecimal weeklyIn   = transactionRepository.sumCreditsSince(userId, startOfWeek);
        BigDecimal weeklyOut  = transactionRepository.sumDebitsSince(userId, startOfWeek);

        long pending = moneyRequestRepository
                .findByTargetUserIdAndStatusOrderByCreatedAtDesc(userId, "PENDING", Pageable.unpaged())
                .getTotalElements();

        return WalletSummaryResponse.builder()
                .todayIn(todayIn)
                .todayOut(todayOut)
                .weeklyIn(weeklyIn)
                .weeklyOut(weeklyOut)
                .pendingRequests((int) pending)
                .build();
    }

    // ── Debit (internal API — called by Transfer, Payment, Agent services) ───

    @Transactional
    public WalletOperationResponse debit(DebitWalletRequest req) {
        TransactionType type = TransactionType.valueOf(req.getType());

        Transaction txn = ledgerService.debit(
                req.getUserId(),
                req.getAmount(),
                BigDecimal.ZERO,
                type,
                req.getReference(),
                req.getCounterpartyName(),
                req.getNote(),
                req.getIdempotencyKey()
        );

        int loyaltyPoints = calculatePoints(req.getAmount());

        publishTransactionEvent(txn);

        return WalletOperationResponse.builder()
                .transactionId(txn.getId())
                .reference(txn.getReference())
                .status(txn.getStatus().name())
                .amount(txn.getAmount())
                .fee(txn.getFee())
                .newBalance(txn.getBalanceAfter())
                .loyaltyPointsEarned(loyaltyPoints)
                .build();
    }

    // ── Credit (internal API) ────────────────────────────────────

    @Transactional
    public WalletOperationResponse credit(CreditWalletRequest req) {
        TransactionType type = TransactionType.valueOf(req.getType());

        Transaction txn = ledgerService.credit(
                req.getUserId(),
                req.getAmount(),
                BigDecimal.ZERO,
                type,
                req.getReference(),
                req.getCounterpartyName(),
                req.getNote(),
                req.getIdempotencyKey()
        );

        publishTransactionEvent(txn);

        return WalletOperationResponse.builder()
                .transactionId(txn.getId())
                .reference(txn.getReference())
                .status(txn.getStatus().name())
                .amount(txn.getAmount())
                .fee(BigDecimal.ZERO)
                .newBalance(txn.getBalanceAfter())
                .loyaltyPointsEarned(0)
                .build();
    }

    // ── Transaction History ──────────────────────────────────────

    @Transactional(readOnly = true)
    public TransactionPageResponse getTransactions(UUID userId, String type,
                                                    String status, Instant from,
                                                    Instant to, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Instant fromDate  = from  != null ? from  : Instant.now().minus(90, ChronoUnit.DAYS);
        Instant toDate    = to    != null ? to    : Instant.now();

        TransactionType txnType     = parseEnum(type, TransactionType.class);
        com.globalpay.model.enums.TransactionStatus txnStatus =
                parseEnum(status, com.globalpay.model.enums.TransactionStatus.class);

        Page<Transaction> page_ = transactionRepository.searchTransactions(
                userId, txnType, txnStatus, fromDate, toDate, pageable);

        BigDecimal periodIn  = transactionRepository.sumCreditsSince(userId, fromDate);
        BigDecimal periodOut = transactionRepository.sumDebitsSince(userId, fromDate);

        List<TransactionResponse> items = page_.getContent().stream()
                .map(t -> mapToResponse(t, userId))
                .collect(Collectors.toList());

        return TransactionPageResponse.builder()
                .transactions(items)
                .page(page)
                .totalPages(page_.getTotalPages())
                .totalTransactions(page_.getTotalElements())
                .netAmount(periodIn.subtract(periodOut))
                .periodIn(periodIn)
                .periodOut(periodOut)
                .build();
    }

    // ── Single Transaction ───────────────────────────────────────

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(UUID transactionId) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new WalletNotFoundException("Transaction not found: " + transactionId));
        return mapToResponse(txn, txn.getSenderUserId());
    }

    // ── Reverse (Admin only) ─────────────────────────────────────

    @Transactional
    public TransactionResponse reverseTransaction(UUID transactionId, String reason) {
        Transaction reversal = ledgerService.reverse(transactionId, reason);
        return mapToResponse(reversal, null);
    }

    // ── Cleanup Expired Requests (scheduled) ────────────────────

    @Scheduled(fixedDelay = 600_000) // every 10 minutes
    @Transactional
    public void expireMoneyRequests() {
        int expired = moneyRequestRepository.expireOldRequests(Instant.now());
        if (expired > 0) log.info("Expired {} stale money requests", expired);
    }

    // ── Internal helpers ─────────────────────────────────────────

    private Wallet getWalletOrThrow(UUID userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new WalletNotFoundException("Wallet not found for user: " + userId));
    }

    private int calculatePoints(BigDecimal amount) {
        return amount.multiply(POINTS_PER_ETB).intValue();
    }

    private void publishTransactionEvent(Transaction txn) {
        try {
            TransactionCompletedEvent event = TransactionCompletedEvent.builder()
                    .eventId(UUID.randomUUID())
                    .transactionId(txn.getId())
                    .reference(txn.getReference())
                    .type(txn.getType().name())
                    .senderId(txn.getSenderUserId())
                    .senderWalletId(txn.getSenderWalletId())
                    .recipientId(txn.getRecipientUserId())
                    .recipientWalletId(txn.getRecipientWalletId())
                    .amount(txn.getAmount())
                    .fee(txn.getFee())
                    .currency(txn.getCurrency())
                    .counterpartyName(txn.getCounterpartyName())
                    .note(txn.getNote())
                    .timestamp(Instant.now())
                    .build();

            kafkaTemplate.send("transfer.completed", txn.getId().toString(), event);
        } catch (Exception e) {
            // Kafka publish failure must never roll back the financial transaction
            log.error("Failed to publish transaction event for ref={}: {}", txn.getReference(), e.getMessage());
        }
    }

    private TransactionResponse mapToResponse(Transaction t, UUID currentUserId) {
        // Determine signed amount from current user's perspective
        boolean isSender = t.getSenderUserId() != null &&
                           t.getSenderUserId().equals(currentUserId);
        BigDecimal signedAmount = isSender ? t.getAmount().negate() : t.getAmount();

        return TransactionResponse.builder()
                .id(t.getId())
                .reference(t.getReference())
                .type(t.getType().name())
                .counterparty(t.getCounterpartyName())
                .amount(signedAmount)
                .fee(t.getFee())
                .totalAmount(t.getTotalAmount())
                .note(t.getNote())
                .status(t.getStatus().name())
                .loyaltyPointsEarned(t.getLoyaltyPointsEarned())
                .balanceAfter(t.getBalanceAfter())
                .date(t.getCreatedAt())
                .build();
    }

    private <E extends Enum<E>> E parseEnum(String value, Class<E> enumClass) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) return null;
        try {
            return Enum.valueOf(enumClass, value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
