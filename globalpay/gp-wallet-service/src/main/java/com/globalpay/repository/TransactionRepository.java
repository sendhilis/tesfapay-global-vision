package com.globalpay.repository;
import com.globalpay.model.entity.Transaction;
import com.globalpay.model.enums.TransactionStatus;
import com.globalpay.model.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByReference(String reference);
    Optional<Transaction> findByIdempotencyKey(String key);
    Page<Transaction> findBySenderUserIdOrRecipientUserIdOrderByCreatedAtDesc(UUID senderId, UUID recipientId, Pageable pageable);
    @Query("SELECT t FROM Transaction t WHERE (t.senderUserId = :userId OR t.recipientUserId = :userId) AND (:type IS NULL OR t.type = :type) AND (:status IS NULL OR t.status = :status) AND t.createdAt BETWEEN :from AND :to ORDER BY t.createdAt DESC")
    Page<Transaction> searchTransactions(UUID userId, TransactionType type, TransactionStatus status, Instant from, Instant to, Pageable pageable);
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.recipientUserId = :userId AND t.status = 'COMPLETED' AND t.createdAt >= :since")
    BigDecimal sumCreditsSince(UUID userId, Instant since);
    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.senderUserId = :userId AND t.status = 'COMPLETED' AND t.createdAt >= :since")
    BigDecimal sumDebitsSince(UUID userId, Instant since);
    List<Transaction> findByStatusOrderByCreatedAtAsc(TransactionStatus status);
    @Query("SELECT COALESCE(SUM(CASE WHEN e.entryType = 'CREDIT' THEN e.amount ELSE -e.amount END), 0) FROM LedgerEntry e WHERE e.userId = :userId")
    BigDecimal computeLedgerBalance(UUID userId);
    long countBySenderUserIdOrRecipientUserId(UUID senderId, UUID recipientId);
}