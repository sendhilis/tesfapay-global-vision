package com.globalpay.repository;
import com.globalpay.model.entity.Redemption;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface RedemptionRepository extends JpaRepository<Redemption, UUID> { List<Redemption> findByUserIdOrderByCreatedAtDesc(UUID userId); }
