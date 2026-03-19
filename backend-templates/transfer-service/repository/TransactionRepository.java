package com.globalpay.transfer.repository;

import com.globalpay.transfer.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Transaction repository — central ledger queries.
 * Maps to: DATABASE_SCHEMA.md §4
 * Supports: TransactionHistory.tsx, AdminTransactions.tsx
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByReference(String reference);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    /**
     * User's transaction history — sent or received.
     * Front-end: TransactionHistory.tsx
     * API: GET /transactions?type=ALL&page=0&size=20
     */
    @Query("SELECT t FROM Transaction t WHERE " +
           "(t.senderUserId = :userId OR t.recipientUserId = :userId) " +
           "AND (:type IS NULL OR t.type = :type) " +
           "ORDER BY t.createdAt DESC")
    Page<Transaction> findByUserIdAndType(UUID userId, String type, Pageable pageable);

    /**
     * Admin: all transactions with filters.
     * Front-end: AdminTransactions.tsx
     * API: GET /admin/transactions
     */
    @Query("SELECT t FROM Transaction t WHERE " +
           "t.createdAt BETWEEN :from AND :to " +
           "ORDER BY t.createdAt DESC")
    Page<Transaction> findAllInDateRange(Instant from, Instant to, Pageable pageable);

    /**
     * Flagged transactions for fraud review.
     * Front-end: AdminDashboard.tsx (fraud alerts)
     */
    Page<Transaction> findByFlaggedTrue(Pageable pageable);
}
