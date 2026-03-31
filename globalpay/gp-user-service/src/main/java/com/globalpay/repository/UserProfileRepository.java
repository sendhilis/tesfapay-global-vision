package com.globalpay.repository;

import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByUserId(UUID userId);
    Optional<UserProfile> findByPhone(String phone);
    Optional<UserProfile> findByWalletId(String walletId);
    boolean existsByPhone(String phone);
}
