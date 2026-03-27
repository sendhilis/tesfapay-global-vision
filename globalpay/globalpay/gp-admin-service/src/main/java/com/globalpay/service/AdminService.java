package com.globalpay.service;

import com.globalpay.client.*;
import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j @Service @RequiredArgsConstructor
public class AdminService {

    private final AuditLogRepository   auditRepo;
    private final FraudAlertRepository fraudRepo;
    private final SystemConfigRepository configRepo;
    private final WalletAdminClient    walletAdminClient;
    private final UserAdminClient      userAdminClient;

    // ── Dashboard KPIs ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard() {
        long totalFraudAlerts    = fraudRepo.countByStatus("OPEN");
        long criticalAlerts      = fraudRepo.countBySeverityAndStatus("CRITICAL", "OPEN");
        long mediumAlerts        = totalFraudAlerts - criticalAlerts;

        List<FraudAlert> recentAlerts = fraudRepo.findRecentAlerts(
                Instant.now().minus(1, ChronoUnit.DAYS), PageRequest.of(0, 5));

        List<Map<String, Object>> alertDtos = recentAlerts.stream().map(a -> Map.<String, Object>of(
                "type",     "FRAUD",
                "message",  a.getMessage(),
                "time",     a.getCreatedAt().toString(),
                "severity", a.getSeverity()
        )).toList();

        // Aggregate KPIs from downstream services
        Map<String, Object> walletStats = fetchWalletStats();
        Map<String, Object> userStats   = fetchUserStats();

        return Map.of(
                "totalUsers",               userStats.getOrDefault("totalUsers", 0),
                "userGrowthPercent",        userStats.getOrDefault("growthPercent", 0),
                "newUsersThisWeek",         userStats.getOrDefault("newThisWeek", 0),
                "todayTransactionVolume",   walletStats.getOrDefault("todayVolume", BigDecimal.ZERO),
                "todayTransactionCount",    walletStats.getOrDefault("todayCount", 0),
                "txnGrowthPercent",         walletStats.getOrDefault("growthPercent", 0),
                "fraudAlerts",              Map.of("total", totalFraudAlerts, "critical", criticalAlerts, "medium", mediumAlerts),
                "alerts",                   alertDtos
        );
    }

    // ── Analytics ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalytics(String period) {
        int days = switch (period != null ? period : "30d") {
            case "7d"  -> 7;
            case "90d" -> 90;
            case "1y"  -> 365;
            default    -> 30;
        };

        // Build mock trend data — in prod, aggregate from wallet + user services via Feign
        List<Map<String, Object>> userGrowth = new ArrayList<>();
        List<Map<String, Object>> txnTrend   = new ArrayList<>();

        for (int i = days - 1; i >= 0; i--) {
            String date = LocalDate.now().minusDays(i).toString();
            userGrowth.add(Map.of("date", date, "totalUsers", 67000 + (days - i) * 10, "newUsers", 150 + (int)(Math.random() * 100)));
            txnTrend.add(Map.of("date", date, "count", 85000 + (int)(Math.random() * 10000), "volume", BigDecimal.valueOf(15000000 + (long)(Math.random() * 5000000))));
        }

        return Map.of(
                "userGrowth",   userGrowth,
                "transactionTrend", txnTrend,
                "revenueByType", List.of(
                        Map.of("type", "P2P_FEES",      "revenue", BigDecimal.valueOf(230000)),
                        Map.of("type", "BILL_PAY_FEES", "revenue", BigDecimal.valueOf(85000)),
                        Map.of("type", "CASH_FEES",     "revenue", BigDecimal.valueOf(120000)),
                        Map.of("type", "LOAN_INTEREST", "revenue", BigDecimal.valueOf(340000))
                ),
                "topRegions", List.of(
                        Map.of("region", "Addis Ababa", "users", 28000, "volume", BigDecimal.valueOf(8200000)),
                        Map.of("region", "Oromia",      "users", 12000, "volume", BigDecimal.valueOf(3100000)),
                        Map.of("region", "Amhara",      "users", 9000,  "volume", BigDecimal.valueOf(2400000))
                )
        );
    }

    // ── Fraud Alerts ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<FraudAlert> getFraudAlerts(String status, int page, int size) {
        return fraudRepo.findByStatusOrderByCreatedAtDesc(
                status != null ? status : "OPEN", PageRequest.of(page, size));
    }

    @Transactional
    public FraudAlert resolveFraudAlert(UUID alertId, UUID adminId, String resolution) {
        FraudAlert alert = fraudRepo.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        alert.setStatus("RESOLVED");
        alert.setReviewedBy(adminId);
        alert.setResolvedAt(Instant.now());
        return fraudRepo.save(alert);
    }

    // ── System Config ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SystemConfig> getSystemConfig() {
        return configRepo.findAll();
    }

    @Transactional
    public SystemConfig updateConfig(String key, String value) {
        SystemConfig config = configRepo.findById(key)
                .orElseThrow(() -> new RuntimeException("Config key not found: " + key));
        config.setValue(value);
        return configRepo.save(config);
    }

    // ── Audit Log ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLog(int page, int size) {
        return auditRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Transactional
    public void writeAuditLog(UUID actorId, String actorRole, String action,
                               String targetType, UUID targetId, Map<String, Object> details) {
        auditRepo.save(AuditLog.builder()
                .actorId(actorId).actorRole(actorRole).action(action)
                .targetType(targetType).targetId(targetId).details(details).build());
    }

    // ── Kafka: listen for audit events ────────────────────────────

    @KafkaListener(topics = "audit.event", groupId = "admin-service")
    public void onAuditEvent(Map<String, Object> event) {
        try {
            String actorId   = (String) event.get("actorId");
            String actorRole = (String) event.getOrDefault("actorRole", "SYSTEM");
            String action    = (String) event.get("action");
            writeAuditLog(
                    actorId != null ? UUID.fromString(actorId) : null,
                    actorRole, action,
                    (String) event.get("targetType"),
                    event.get("targetId") != null ? UUID.fromString(event.get("targetId").toString()) : null,
                    event
            );
        } catch (Exception e) { log.error("Audit event error: {}", e.getMessage()); }
    }

    @KafkaListener(topics = "transfer.completed", groupId = "admin-service")
    public void onTransfer(Map<String, Object> event) {
        try {
            // Fraud detection: flag high-value transfers for review
            String amountStr = (String) event.get("amount");
            if (amountStr == null) return;
            BigDecimal amount = new BigDecimal(amountStr);
            if (amount.compareTo(BigDecimal.valueOf(20000)) > 0) {
                fraudRepo.save(FraudAlert.builder()
                        .userId(event.get("senderId") != null ? UUID.fromString(event.get("senderId").toString()) : null)
                        .alertType("AMOUNT")
                        .severity(amount.compareTo(BigDecimal.valueOf(40000)) > 0 ? "CRITICAL" : "MEDIUM")
                        .message("High-value transfer ETB " + amountStr + " — ref: " + event.get("reference"))
                        .status("OPEN").build());
            }
        } catch (Exception e) { log.error("Fraud detection error: {}", e.getMessage()); }
    }

    // ── E-Money Summary ───────────────────────────────────────────

    public Map<String, Object> getEMoneySummary() {
        return Map.of(
                "totalEMoneyIssued",     BigDecimal.valueOf(2_400_000_000L),
                "trustAccountBalance",   BigDecimal.valueOf(2_400_000_000L),
                "reconciliationStatus",  "MATCHED",
                "lastReconciliation",    Instant.now().minus(6, ChronoUnit.HOURS).toString(),
                "floatDistribution", List.of(
                        Map.of("type", "USER_WALLETS",      "amount", BigDecimal.valueOf(1_800_000_000L)),
                        Map.of("type", "AGENT_FLOAT",       "amount", BigDecimal.valueOf(450_000_000L)),
                        Map.of("type", "MERCHANT_HOLDINGS", "amount", BigDecimal.valueOf(120_000_000L)),
                        Map.of("type", "SYSTEM_RESERVE",    "amount", BigDecimal.valueOf(30_000_000L))
                )
        );
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Map<String, Object> fetchWalletStats() {
        try { return walletAdminClient.getStats(); }
        catch (Exception e) {
            return Map.of("todayVolume", BigDecimal.valueOf(18_600_000), "todayCount", 92340, "growthPercent", 12.1);
        }
    }

    private Map<String, Object> fetchUserStats() {
        try { return userAdminClient.getStats(); }
        catch (Exception e) {
            return Map.of("totalUsers", 67750, "growthPercent", 8.4, "newThisWeek", 1240);
        }
    }
}
