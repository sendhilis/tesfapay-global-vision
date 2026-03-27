package com.globalpay.repository;
import com.globalpay.model.entity.*; import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.UUID;
@Repository public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable p);
}
@Repository public interface FraudAlertRepository extends JpaRepository<FraudAlert, UUID> {
    Page<FraudAlert> findByStatusOrderByCreatedAtDesc(String s, Pageable p);
    long countByStatus(String s);
}
@Repository interface SystemConfigRepository extends JpaRepository<SystemConfig, String> {}
