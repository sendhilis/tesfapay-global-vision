package com.globalpay.wallet.repository;

import com.globalpay.wallet.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Wallet repository with pessimistic locking for balance operations.
 * Maps to: DATABASE_SCHEMA.md §3
 *
 * CRITICAL: Use findByUserIdForUpdate() for any balance-modifying operation
 * to prevent race conditions and double-spending.
 */
@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    Optional<Wallet> findByUserId(UUID userId);

    /**
     * Pessimistic write lock — use for debit/credit operations.
     * Prevents concurrent transactions from reading stale balances.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByUserIdForUpdate(UUID userId);
}
