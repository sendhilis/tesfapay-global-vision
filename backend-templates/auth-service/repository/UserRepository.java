package com.globalpay.auth.repository;

import com.globalpay.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * User repository — data access for users table.
 * Maps to: DATABASE_SCHEMA.md §2
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByWalletId(String walletId);

    boolean existsByPhone(String phone);

    boolean existsByWalletId(String walletId);
}
