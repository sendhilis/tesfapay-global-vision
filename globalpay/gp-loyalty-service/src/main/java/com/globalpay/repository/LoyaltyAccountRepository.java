package com.globalpay.repository;
import com.globalpay.model.entity.LoyaltyAccount;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface LoyaltyAccountRepository extends JpaRepository<LoyaltyAccount, UUID> { Optional<LoyaltyAccount> findByUserId(UUID userId); }
