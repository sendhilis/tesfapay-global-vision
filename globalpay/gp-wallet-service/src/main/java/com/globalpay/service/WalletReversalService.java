package com.globalpay.service;
import com.globalpay.exception.*;
import com.globalpay.model.entity.*;
import com.globalpay.model.enums.TransactionStatus;
import com.globalpay.model.enums.TransactionType;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
/**
 * Banking robustness service handling:
 * 1. Double-credit prevention (idempotency - in LedgerService)
 * 2. USSD failure recovery (PENDING_REVERSAL auto-retry)
 * 3. Ghost/random credit detection (UNDER_REVIEW + wallet lock)
 * 4. Credit reversal (atomic, 7-day window guard)
 * 5. Saga compensation (auto-credit sender on recipient credit failure)
 * 6. Daily reconciliation (ledger sum vs wallet balance)
 */
@Slf4j @Service @RequiredArgsConstructor
public class WalletReversalService {
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerService ledgerService;
    private final ReferenceGenerator referenceGenerator;

    /** Admin-initiated reversal with guards */
    @Transactional
    public void reverseTransaction(UUID transactionId, String reason, UUID reviewerId) {
        Transaction original = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new WalletNotFoundException("Transaction not found: " + transactionId));
        if (original.getStatus() == TransactionStatus.REVERSED)
            throw new DuplicateTransactionException("Already reversed: " + transactionId);
        if (original.getType() == TransactionType.REVERSAL)
            throw new IllegalStateException("Cannot reverse a reversal");
        Instant cutoff = Instant.now().minus(7, ChronoUnit.DAYS);
        if (original.getCompletedAt() != null && original.getCompletedAt().isBefore(cutoff))
            throw new IllegalStateException("Reversal window expired - older than 7 days");
        ledgerService.reverse(transactionId, reason);
        log.warn("MANUAL_REVERSAL txnId={} reason={} reviewer={}", transactionId, reason, reviewerId);
    }

    /** Saga compensation: credit sender back when recipient credit failed */
    @Transactional
    public Transaction compensateSender(UUID senderUserId, BigDecimal amount,
                                         String originalRef, String idempotencyKey) {
        String compKey = idempotencyKey != null ? idempotencyKey + "_compensation" : null;
        if (compKey != null) {
            transactionRepository.findByIdempotencyKey(compKey).ifPresent(t -> {
                throw new DuplicateTransactionException("Compensation already applied for: " + originalRef);
            });
        }
        Transaction comp = ledgerService.credit(senderUserId, amount, BigDecimal.ZERO,
            TransactionType.REVERSAL, referenceGenerator.forReversal(),
            "System Auto-Compensation",
            "Auto-compensation: credit failed for transfer " + originalRef, compKey);
        log.warn("SAGA_COMPENSATION sender={} amount={} originalRef={} compRef={}",
            senderUserId, amount, originalRef, comp.getReference());
        return comp;
    }

    /** Flag suspicious random credit - soft-lock wallet for review */
    @Transactional
    public void flagSuspiciousCredit(UUID walletId, UUID transactionId, String reason) {
        log.error("SUSPICIOUS_CREDIT walletId={} txnId={} reason={}", walletId, transactionId, reason);
        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException("Wallet not found: " + walletId));
        wallet.setLocked(true);
        wallet.setLockedReason("Suspicious credit under review: " + transactionId);
        walletRepository.save(wallet);
        transactionRepository.findById(transactionId).ifPresent(t -> {
            t.setStatus(TransactionStatus.UNDER_REVIEW);
            transactionRepository.save(t);
        });
    }

    /** Every 5 min: find PENDING_REVERSAL debits and auto-reverse them */
    @Scheduled(fixedDelay = 300_000)
    @Transactional
    public void retryPendingReversals() {
        List<Transaction> pending = transactionRepository
            .findByStatusOrderByCreatedAtAsc(TransactionStatus.PENDING_REVERSAL);
        if (pending.isEmpty()) return;
        log.info("Processing {} pending reversals", pending.size());
        for (Transaction txn : pending) {
            try {
                if (txn.getCreatedAt().isAfter(Instant.now().minus(2, ChronoUnit.MINUTES))) continue;
                ledgerService.reverse(txn.getId(), "Auto-reversal: credit partner timed out");
                log.info("AUTO_REVERSED ref={}", txn.getReference());
            } catch (Exception e) {
                log.error("Auto-reversal failed for txn {}: {}", txn.getReference(), e.getMessage());
            }
        }
    }

    /** Daily 2 AM reconciliation: ledger sum vs actual wallet balance */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional(readOnly = true)
    public void dailyReconciliation() {
        log.info("Starting daily wallet reconciliation...");
        List<Wallet> wallets = walletRepository.findAll();
        int issues = 0;
        for (Wallet w : wallets) {
            try {
                BigDecimal ledger = transactionRepository.computeLedgerBalance(w.getUserId());
                if (ledger != null && ledger.compareTo(w.getMainBalance()) != 0) {
                    log.error("RECONCILIATION_MISMATCH walletId={} userId={} wallet={} ledger={} diff={}",
                        w.getWalletId(), w.getUserId(), w.getMainBalance(), ledger,
                        w.getMainBalance().subtract(ledger));
                    issues++;
                }
            } catch (Exception e) {
                log.error("Reconciliation failed for wallet {}: {}", w.getWalletId(), e.getMessage());
            }
        }
        log.info("Reconciliation complete. Issues: {}/{}", issues, wallets.size());
    }
}