package com.globalpay.wallet.service;

import com.globalpay.common.exception.InsufficientBalanceException;
import com.globalpay.common.exception.ResourceNotFoundException;
import com.globalpay.wallet.dto.*;
import com.globalpay.wallet.entity.Wallet;
import com.globalpay.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Wallet service — balance management with pessimistic locking.
 *
 * Maps to: API_CONTRACT.md §3 (Wallet & Balance)
 * Front-end: WalletHome.tsx
 *
 * CRITICAL: All balance operations use pessimistic locking via
 * findByUserIdForUpdate() to prevent race conditions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;

    /**
     * Get wallet balance for current user.
     * GET /wallet/balance
     *
     * Response: { mainBalance, savingsBalance, loanBalance, loyaltyPoints, currency }
     * Front-end: WalletHome.tsx — balance card at top
     */
    @Transactional(readOnly = true)
    public BalanceResponse getBalance(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        return BalanceResponse.builder()
                .mainBalance(wallet.getMainBalance())
                .savingsBalance(wallet.getSavingsBalance())
                .loanBalance(wallet.getLoanBalance())
                .currency(wallet.getCurrency())
                .lastUpdated(wallet.getUpdatedAt())
                .build();
    }

    /**
     * Debit wallet — subtract amount from main balance.
     * Used by: transfer-service (P2P send), payment-service (bill pay), etc.
     *
     * @throws InsufficientBalanceException if balance < amount
     */
    @Transactional
    public BigDecimal debit(UUID userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        if (wallet.getIsLocked()) {
            throw new RuntimeException("Wallet is locked: " + wallet.getLockedReason());
        }

        if (wallet.getMainBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(
                    "Insufficient balance. Available: " + wallet.getMainBalance() +
                    ", Required: " + amount);
        }

        wallet.setMainBalance(wallet.getMainBalance().subtract(amount));
        walletRepository.save(wallet);

        log.info("Debited {} from user {} wallet. New balance: {}",
                amount, userId, wallet.getMainBalance());

        return wallet.getMainBalance();
    }

    /**
     * Credit wallet — add amount to main balance.
     * Used by: transfer-service (P2P receive), cash-in, loan disbursement
     */
    @Transactional
    public BigDecimal credit(UUID userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        wallet.setMainBalance(wallet.getMainBalance().add(amount));
        walletRepository.save(wallet);

        log.info("Credited {} to user {} wallet. New balance: {}",
                amount, userId, wallet.getMainBalance());

        return wallet.getMainBalance();
    }

    /**
     * Create wallet for new user (called by auth-service via Feign).
     */
    @Transactional
    public Wallet createWallet(UUID userId) {
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .mainBalance(BigDecimal.ZERO)
                .savingsBalance(BigDecimal.ZERO)
                .loanBalance(BigDecimal.ZERO)
                .build();
        return walletRepository.save(wallet);
    }
}
