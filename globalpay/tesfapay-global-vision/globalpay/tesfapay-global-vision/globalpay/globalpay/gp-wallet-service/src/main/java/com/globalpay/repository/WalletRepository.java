package com.globalpay.repository;

import com.globalpay.model.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    Optional<Wallet> findByUserId(UUID userId);

    Optional<Wallet> findByWalletId(String walletId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByUserIdForUpdate(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.walletId = :walletId")
    Optional<Wallet> findByWalletIdForUpdate(String walletId);

    @Modifying
    @Query("UPDATE Wallet w SET w.mainBalance = w.mainBalance - :amount, w.updatedAt = CURRENT_TIMESTAMP WHERE w.userId = :userId AND w.mainBalance >= :amount")
    int debitMainBalance(UUID userId, BigDecimal amount);

    @Modifying
    @Query("UPDATE Wallet w SET w.mainBalance = w.mainBalance + :amount, w.updatedAt = CURRENT_TIMESTAMP WHERE w.userId = :userId")
    int creditMainBalance(UUID userId, BigDecimal amount);

    @Modifying
    @Query("UPDATE Wallet w SET w.savingsBalance = w.savingsBalance + :amount, w.mainBalance = w.mainBalance - :amount WHERE w.userId = :userId AND w.mainBalance >= :amount")
    int moveToSavings(UUID userId, BigDecimal amount);

    @Modifying
    @Query("UPDATE Wallet w SET w.savingsBalance = w.savingsBalance - :amount, w.mainBalance = w.mainBalance + :amount WHERE w.userId = :userId AND w.savingsBalance >= :amount")
    int moveFromSavings(UUID userId, BigDecimal amount);
}
