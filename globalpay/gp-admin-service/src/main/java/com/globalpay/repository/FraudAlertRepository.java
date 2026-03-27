package com.globalpay.repository;
import com.globalpay.model.entity.FraudAlert;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.*;
@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, UUID> {
    Page<FraudAlert> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    long countByStatus(String status);
    long countBySeverityAndStatus(String severity, String status);
    @Query("SELECT f FROM FraudAlert f WHERE f.createdAt >= :since ORDER BY f.createdAt DESC")
    List<FraudAlert> findRecentAlerts(Instant since, Pageable pageable);
}
