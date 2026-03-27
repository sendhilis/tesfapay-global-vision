package com.globalpay.service;

import com.globalpay.client.WalletClient;
import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BillerRepository           billerRepo;
    private final TelecomOperatorRepository  operatorRepo;
    private final AirtimeBundleRepository    bundleRepo;
    private final MerchantRepository         merchantRepo;
    private final PaymentTransactionRepository txnRepo;
    private final WalletClient               walletClient;
    private final KafkaTemplate<String, Object> kafka;

    private static final BigDecimal POINTS_PER_ETB = new BigDecimal("0.1");

    // ── Billers ──────────────────────────────────────────────────

    public List<Biller> getBillers(String category) {
        return category != null && !category.isBlank()
                ? billerRepo.findByCategoryAndActiveTrue(category.toUpperCase())
                : billerRepo.findByActiveTrue();
    }

    public Map<String, Object> validateBiller(UUID billerId, String accountNumber) {
        Biller biller = billerRepo.findById(billerId)
                .orElseThrow(() -> new RuntimeException("Biller not found: " + billerId));
        // In production: call biller's real API endpoint
        // For dev: return mock validation
        return Map.of(
                "valid", true,
                "accountHolder", "Customer - " + accountNumber,
                "outstandingAmount", BigDecimal.valueOf(Math.random() * 500 + 50).setScale(2, java.math.RoundingMode.HALF_UP)
        );
    }

    @Transactional
    public Map<String, Object> payBill(UUID userId, String walletId, UUID billerId,
                                        String accountNumber, BigDecimal amount, String idempotencyKey) {
        if (idempotencyKey != null) {
            Optional<PaymentTransaction> existing = txnRepo.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) return buildPayResponse(existing.get(), null);
        }

        Biller biller = billerRepo.findById(billerId)
                .orElseThrow(() -> new RuntimeException("Biller not found"));

        String ref = genRef("BIL");
        PaymentTransaction txn = PaymentTransaction.builder()
                .reference(ref).type("BILL").userId(userId).walletId(walletId)
                .billerId(billerId).accountNumber(accountNumber).amount(amount)
                .fee(BigDecimal.ZERO).status("PENDING").idempotencyKey(idempotencyKey).build();
        txnRepo.save(txn);

        var walletResp = walletClient.debit(userId, amount, "BILL_PAYMENT", ref,
                biller.getName(), "Bill payment: " + accountNumber);
        txn.setStatus("COMPLETED");
        txn.setLoyaltyPointsEarned(amount.multiply(POINTS_PER_ETB).intValue());
        txn.setBalanceAfter(walletResp != null ? walletResp.getNewBalance() : null);
        txn.setCompletedAt(Instant.now());
        txnRepo.save(txn);

        publishEvent("payment.completed", txn, Map.of("billerName", biller.getName()));
        return buildPayResponse(txn, biller.getName());
    }

    // ── Airtime ──────────────────────────────────────────────────

    public List<TelecomOperator> getOperators() {
        return operatorRepo.findByActiveTrue();
    }

    @Transactional
    public Map<String, Object> topupAirtime(UUID userId, String walletId, UUID operatorId,
                                             UUID bundleId, String recipientPhone, String idempotencyKey) {
        if (idempotencyKey != null) {
            Optional<PaymentTransaction> ex = txnRepo.findByIdempotencyKey(idempotencyKey);
            if (ex.isPresent()) return buildAirtimeResponse(ex.get(), null, null);
        }

        TelecomOperator op = operatorRepo.findById(operatorId)
                .orElseThrow(() -> new RuntimeException("Operator not found"));
        AirtimeBundle bundle = bundleRepo.findById(bundleId)
                .orElseThrow(() -> new RuntimeException("Bundle not found"));

        String ref = genRef("AIR");
        PaymentTransaction txn = PaymentTransaction.builder()
                .reference(ref).type("AIRTIME").userId(userId).walletId(walletId)
                .operatorId(operatorId).bundleId(bundleId)
                .recipientPhone(recipientPhone).amount(bundle.getPrice())
                .fee(BigDecimal.ZERO).status("PENDING").idempotencyKey(idempotencyKey).build();
        txnRepo.save(txn);

        var walletResp = walletClient.debit(userId, bundle.getPrice(), "AIRTIME", ref,
                op.getName(), bundle.getName() + " for " + recipientPhone);
        txn.setStatus("COMPLETED");
        txn.setLoyaltyPointsEarned(bundle.getPrice().multiply(POINTS_PER_ETB).intValue());
        txn.setBalanceAfter(walletResp != null ? walletResp.getNewBalance() : null);
        txn.setCompletedAt(Instant.now());
        txnRepo.save(txn);

        publishEvent("payment.completed", txn, Map.of("operatorName", op.getName(), "bundleName", bundle.getName()));
        return buildAirtimeResponse(txn, op.getName(), bundle);
    }

    // ── Merchant ─────────────────────────────────────────────────

    public List<Merchant> getMerchants(String search, String category) {
        if (search != null && !search.isBlank()) return merchantRepo.search(search);
        if (category != null && !category.isBlank()) return merchantRepo.findByCategoryAndStatus(category.toUpperCase(), "ACTIVE");
        return merchantRepo.findAll();
    }

    public Optional<Merchant> scanQr(String qrPayload) {
        // Parse globalpay://pay?merchant=MERCH-001
        String merchantId = qrPayload.contains("merchant=")
                ? qrPayload.split("merchant=")[1].split("&")[0] : qrPayload;
        return merchantRepo.findByMerchantId(merchantId);
    }

    @Transactional
    public Map<String, Object> payMerchant(UUID userId, String walletId, String merchantId,
                                            BigDecimal amount, String idempotencyKey) {
        Merchant merchant = merchantRepo.findByMerchantId(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found: " + merchantId));
        String ref = genRef("MRX");
        PaymentTransaction txn = PaymentTransaction.builder()
                .reference(ref).type("MERCHANT").userId(userId).walletId(walletId)
                .merchantId(merchant.getId()).amount(amount)
                .fee(BigDecimal.ZERO).status("PENDING").idempotencyKey(idempotencyKey).build();
        txnRepo.save(txn);

        var walletResp = walletClient.debit(userId, amount, "MERCHANT", ref, merchant.getName(), null);
        txn.setStatus("COMPLETED");
        txn.setLoyaltyPointsEarned(amount.multiply(BigDecimal.valueOf(0.1)).intValue());
        txn.setBalanceAfter(walletResp != null ? walletResp.getNewBalance() : null);
        txn.setCompletedAt(Instant.now());
        txnRepo.save(txn);

        publishEvent("payment.completed", txn, Map.of("merchantName", merchant.getName()));
        return Map.of(
                "transactionId", txn.getId(), "reference", txn.getReference(),
                "merchantName", merchant.getName(), "merchantCategory", merchant.getCategory(),
                "amount", txn.getAmount(), "fee", BigDecimal.ZERO,
                "loyaltyPointsEarned", txn.getLoyaltyPointsEarned(),
                "status", "COMPLETED", "newBalance", txn.getBalanceAfter() != null ? txn.getBalanceAfter() : BigDecimal.ZERO,
                "createdAt", txn.getCreatedAt()
        );
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Map<String, Object> buildPayResponse(PaymentTransaction txn, String billerName) {
        return Map.of("transactionId", txn.getId(), "reference", txn.getReference(),
                "billerName", billerName != null ? billerName : "",
                "amount", txn.getAmount(), "fee", txn.getFee(), "status", txn.getStatus(),
                "loyaltyPointsEarned", txn.getLoyaltyPointsEarned(),
                "newBalance", txn.getBalanceAfter() != null ? txn.getBalanceAfter() : BigDecimal.ZERO,
                "createdAt", txn.getCreatedAt());
    }

    private Map<String, Object> buildAirtimeResponse(PaymentTransaction txn,
                                                       String opName, AirtimeBundle bundle) {
        return Map.of("transactionId", txn.getId(), "reference", txn.getReference(),
                "operatorName", opName != null ? opName : "",
                "bundleName", bundle != null ? bundle.getName() : "",
                "amount", txn.getAmount(),
                "validity", bundle != null ? bundle.getValidity() : "",
                "status", txn.getStatus(),
                "loyaltyPointsEarned", txn.getLoyaltyPointsEarned(),
                "newBalance", txn.getBalanceAfter() != null ? txn.getBalanceAfter() : BigDecimal.ZERO,
                "createdAt", txn.getCreatedAt());
    }

    private String genRef(String prefix) {
        return String.format("%s%s%05d", prefix,
                DateTimeFormatter.ofPattern("yyyyMMdd").format(java.time.LocalDate.now()),
                (int)(Math.random() * 99999));
    }

    private void publishEvent(String topic, PaymentTransaction txn, Map<String, Object> extra) {
        try {
            Map<String, Object> event = new HashMap<>(extra);
            event.put("transactionId", txn.getId().toString());
            event.put("reference", txn.getReference());
            event.put("type", txn.getType());
            event.put("userId", txn.getUserId().toString());
            event.put("amount", txn.getAmount().toPlainString());
            event.put("timestamp", Instant.now().toString());
            kafka.send(topic, txn.getId().toString(), event);
        } catch (Exception e) { log.error("Kafka publish error: {}", e.getMessage()); }
    }
}
