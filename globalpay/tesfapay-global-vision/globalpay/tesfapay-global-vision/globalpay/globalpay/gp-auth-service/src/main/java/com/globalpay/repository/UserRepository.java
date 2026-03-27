package com.globalpay.repository;

import com.globalpay.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByWalletId(String walletId);

    boolean existsByPhone(String phone);

    @Modifying
    @Query("UPDATE User u SET u.failedPinAttempts = u.failedPinAttempts + 1 WHERE u.id = :id")
    void incrementFailedPinAttempts(UUID id);

    @Modifying
    @Query("UPDATE User u SET u.failedPinAttempts = 0, u.lockedUntil = null WHERE u.id = :id")
    void resetFailedPinAttempts(UUID id);

    @Modifying
    @Query("UPDATE User u SET u.lastLoginAt = CURRENT_TIMESTAMP WHERE u.id = :id")
    void updateLastLogin(UUID id);
}
