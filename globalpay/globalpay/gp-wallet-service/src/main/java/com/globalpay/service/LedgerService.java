package com.globalpay.service;

import com.globalpay.exception.*;
import com.globalpay.model.entity.*;
import com.globalpay.model.enums.EntryType;
import com.globalpay.model.enums.TransactionStatus;
import com.globalpay.model.enums.TransactionType;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Double-entry ledger service.
 *
 * Every financial movement produces exactly two ledger entries:
 *   DEBIT  – money leaves a wallet
 *   CREDIT – money enters a wallet
 *
 * This ensures sum(DEBIT) == sum(CREDIT) at all times for reconciliation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final WalletRepository      walletRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final ReferenceGenerator    referenceGenerator;

    // ── Credit (money enters wallet) ────────────────────────────

    @Transactional
    public Transaction credit(UUID userId,
                              BigDecimal amount,
                              BigDecimal fee,
                              TransactionType type,
                              String reference,
                              String counterpartyName,
                              String note,
                              String idempotencyKey) {

        // Idempotency check
        if (idempotencyKey != null) {
            Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Idempotent credit request, returning existing txn: {}", idempotencyKey);
                return existing.get();
            }
        }

        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new WalletNotFoundException("Wallet not found for user: " + userId));

        if (wallet.isLocked()) {
            throw new WalletLockedException("Wallet is locked: " + wallet.getLockedReason());
        }

        BigDecimal balanceBefore = wallet.getMainBalance();
        BigDecimal balanceAfter  = balanceBefore.add(amount);

        // Update wallet balance
        int updated = walletRepository.creditMainBalance(userId, amount);
        if (updated == 0) throw new WalletNotFoundException("Failed to credit wallet for user: " + userId);

        // Build transaction record
        Transaction txn = Transaction.builder()
                .reference(reference != null ? reference : referenceGenerator.forTransfer())
                .type(type)
                .recipientUserId(userId)
                .recipientWalletId(wallet.getWalletId())
                .amount(amount)
                .fee(fee != null ? fee : BigDecimal.ZERO)
                .totalAmount(amount)
                .status(TransactionStatus.COMPLETED)
                .counterpartyName(counterpartyName)
                .note(note)
                .balanceAfter(balanceAfter)
                .idempotencyKey(idempotencyKey)
                .completedAt(Instant.now())
                .build();

        transactionRepository.save(txn);

        // Ledger entry – CREDIT
        ledgerEntryRepository.save(LedgerEntry.builder()
                .transaction(txn)
                .walletId(wallet.getWalletId())
                .userId(userId)
                .entryType(EntryType.CREDIT)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .build());

        log.info("CREDIT userId={} amount={} ref={} newBalance={}", userId, amount, txn.getReference(), balanceAfter);
        return txn;
    }

    // ── Debit (money leaves wallet) ──────────────────────────────

    @Transactional
    public Transaction debit(UUID userId,
                             BigDecimal amount,
                             BigDecimal fee,
                             TransactionType type,
                             String reference,
                             String counterpartyName,
                             String note,
                             String idempotencyKey) {

        // Idempotency check
        if (idempotencyKey != null) {
            Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Idempotent debit request, returning existing txn: {}", idempotencyKey);
                return existing.get();
            }
        }

        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new WalletNotFoundException("Wallet not found for user: " + userId));

        if (wallet.isLocked()) {
            throw new WalletLockedException("Wallet is locked: " + wallet.getLockedReason());
        }

        BigDecimal totalDeduction = amount.add(fee != null ? fee : BigDecimal.ZERO);

        if (wallet.getMainBalance().compareTo(totalDeduction) < 0) {
            throw new InsufficientBalanceException(
                    String.format("Insufficient balance. Available: %.2f ETB, Required: %.2f ETB",
                            wallet.getMainBalance(), totalDeduction));
        }

        BigDecimal balanceBefore = wallet.getMainBalance();
        BigDecimal balanceAfter  = balanceBefore.subtract(totalDeduction);

        // Update wallet balance
        int updated = walletRepository.debitMainBalance(userId, totalDeduction);
        if (updated == 0) {
            throw new InsufficientBalanceException("Debit failed — balance check race condition for user: " + userId);
        }

        // Build transaction record
        Transaction txn = Transaction.builder()
                .reference(reference != null ? reference : referenceGenerator.forTransfer())
                .type(type)
                .senderUserId(userId)
                .senderWalletId(wallet.getWalletId())
                .amount(amount)
                .fee(fee != null ? fee : BigDecimal.ZERO)
                .totalAmount(totalDeduction)
                .status(TransactionStatus.COMPLETED)
                .counterpartyName(counterpartyName)
                .note(note)
                .balanceAfter(balanceAfter)
                .idempotencyKey(idempotencyKey)
                .completedAt(Instant.now())
                .build();

        transactionRepository.save(txn);

        // Ledger entry – DEBIT
        ledgerEntryRepository.save(LedgerEntry.builder()
                .transaction(txn)
                .walletId(wallet.getWalletId())
                .userId(userId)
                .entryType(EntryType.DEBIT)
                .amount(totalDeduction)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .build());

        log.info("DEBIT userId={} amount={} fee={} ref={} newBalance={}", userId, amount, fee, txn.getReference(), balanceAfter);
        return txn;
    }

    // ── Transfer (atomic debit + credit) ────────────────────────

    @Transactional
    public Transaction transfer(UUID senderUserId,
                                UUID recipientUserId,
                                BigDecimal amount,
                                BigDecimal fee,
                                String senderNote,
                                String idempotencyKey) {

        // Idempotency check
        if (idempotencyKey != null) {
            Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) return existing.get();
        }

        // Lock both wallets in consistent UUID order to avoid deadlock
        UUID first  = senderUserId.compareTo(recipientUserId) < 0 ? senderUserId  : recipientUserId;
        UUID second = senderUserId.compareTo(recipientUserId) < 0 ? recipientUserId : senderUserId;

        Wallet w1 = walletRepository.findByUserIdForUpdate(first)
                .orElseThrow(() -> new WalletNotFoundException("Wallet not found: " + first));
        Wallet w2 = walletRepository.findByUserIdForUpdate(second)
                .orElseThrow(() -> new WalletNotFoundException("Wallet not found: " + second));

        Wallet senderWallet    = first.equals(senderUserId)    ? w1 : w2;
        Wallet recipientWallet = first.equals(recipientUserId) ? w1 : w2;

        if (senderWallet.isLocked()) throw new WalletLockedException("Sender wallet is locked");
        if (recipientWallet.isLocked()) throw new WalletLockedException("Recipient wallet is locked");

        BigDecimal totalDeduction = amount.add(fee != null ? fee : BigDecimal.ZERO);
        if (senderWallet.getMainBalance().compareTo(totalDeduction) < 0) {
            throw new InsufficientBalanceException(
                    String.format("Insufficient balance. Available: %.2f ETB, Required: %.2f ETB",
                            senderWallet.getMainBalance(), totalDeduction));
        }

        String ref                   = referenceGenerator.forTransfer();
        BigDecimal senderBefore      = senderWallet.getMainBalance();
        BigDecimal senderAfter       = senderBefore.subtract(totalDeduction);
        BigDecimal recipientBefore   = recipientWallet.getMainBalance();
        BigDecimal recipientAfter    = recipientBefore.add(amount);

        // Atomic balance updates
        walletRepository.debitMainBalance(senderUserId, totalDeduction);
        walletRepository.creditMainBalance(recipientUserId, amount);

        // Single transaction record (type P2P_SEND from sender perspective)
        Transaction txn = Transaction.builder()
                .reference(ref)
                .type(TransactionType.P2P_SEND)
                .senderUserId(senderUserId)
                .senderWalletId(senderWallet.getWalletId())
                .recipientUserId(recipientUserId)
                .recipientWalletId(recipientWallet.getWalletId())
                .amount(amount)
                .fee(fee != null ? fee : BigDecimal.ZERO)
                .totalAmount(totalDeduction)
                .status(TransactionStatus.COMPLETED)
                .note(senderNote)
                .balanceAfter(senderAfter)
                .idempotencyKey(idempotencyKey)
                .completedAt(Instant.now())
                .build();

        transactionRepository.save(txn);

        // Double-entry ledger
        ledgerEntryRepository.save(LedgerEntry.builder()
                .transaction(txn).walletId(senderWallet.getWalletId())
                .userId(senderUserId).entryType(EntryType.DEBIT)
                .amount(totalDeduction).balanceBefore(senderBefore).balanceAfter(senderAfter)
                .build());

        ledgerEntryRepository.save(LedgerEntry.builder()
                .transaction(txn).walletId(recipientWallet.getWalletId())
                .userId(recipientUserId).entryType(EntryType.CREDIT)
                .amount(amount).balanceBefore(recipientBefore).balanceAfter(recipientAfter)
                .build());

        log.info("TRANSFER sender={} recipient={} amount={} fee={} ref={}", senderUserId, recipientUserId, amount, fee, ref);
        return txn;
    }

    // ── Reverse a transaction ────────────────────────────────────

    @Transactional
    public Transaction reverse(UUID transactionId, String reason) {
        Transaction original = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new WalletNotFoundException("Transaction not found: " + transactionId));

        if (original.getStatus() == TransactionStatus.REVERSED) {
            throw new DuplicateTransactionException("Transaction already reversed: " + transactionId);
        }

        // Refund to sender (credit back)
        if (original.getSenderUserId() != null) {
            walletRepository.creditMainBalance(original.getSenderUserId(), original.getTotalAmount());
        }
        // Deduct from recipient (debit back)
        if (original.getRecipientUserId() != null) {
            walletRepository.debitMainBalance(original.getRecipientUserId(), original.getAmount());
        }

        // Mark original as reversed
        original.setStatus(TransactionStatus.REVERSED);
        transactionRepository.save(original);

        // Create reversal transaction
        Transaction reversal = Transaction.builder()
                .reference(referenceGenerator.forReversal())
                .type(TransactionType.REVERSAL)
                .senderUserId(original.getRecipientUserId())
                .recipientUserId(original.getSenderUserId())
                .amount(original.getAmount())
                .fee(BigDecimal.ZERO)
                .totalAmount(original.getAmount())
                .status(TransactionStatus.COMPLETED)
                .reversalOf(original)
                .note("Reversal: " + reason)
                .completedAt(Instant.now())
                .build();

        transactionRepository.save(reversal);
        log.info("REVERSAL originalRef={} reason={}", original.getReference(), reason);
        return reversal;
    }
}
