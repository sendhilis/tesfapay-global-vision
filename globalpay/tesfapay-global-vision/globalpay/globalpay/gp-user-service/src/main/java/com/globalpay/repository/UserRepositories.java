package com.globalpay.repository;

import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByUserId(UUID userId);
    Optional<UserProfile> findByPhone(String phone);
    Optional<UserProfile> findByWalletId(String walletId);
    boolean existsByPhone(String phone);

    @Query("SELECT u FROM UserProfile u WHERE " +
           "(:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%',:search,'%')) OR u.phone LIKE CONCAT('%',:search,'%')) " +
           "AND (:status IS NULL OR u.status = :status) " +
           "AND (:kycLevel IS NULL OR u.kycLevel = :kycLevel)")
    Page<UserProfile> searchUsers(String search, String status, Short kycLevel, Pageable pageable);
}

@Repository public interface KycApplicationRepository extends JpaRepository<KycApplication, UUID> {
    List<KycApplication> findByUserIdOrderBySubmittedAtDesc(UUID userId);
    Page<KycApplication> findByStatusOrderBySubmittedAtAsc(String status, Pageable pageable);
    Optional<KycApplication> findTopByUserIdOrderBySubmittedAtDesc(UUID userId);
}
