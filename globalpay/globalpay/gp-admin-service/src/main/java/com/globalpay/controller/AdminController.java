package com.globalpay.controller;

import com.globalpay.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    // ── GET /admin/dashboard ──────────────────────────────────────
    @GetMapping("/admin/dashboard")
    public ResponseEntity<?> dashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    // ── GET /admin/analytics ──────────────────────────────────────
    @GetMapping("/admin/analytics")
    public ResponseEntity<?> analytics(@RequestParam(defaultValue = "30d") String period) {
        return ResponseEntity.ok(adminService.getAnalytics(period));
    }

    // ── GET /admin/emoney ─────────────────────────────────────────
    @GetMapping("/admin/emoney")
    public ResponseEntity<?> emoney() {
        return ResponseEntity.ok(adminService.getEMoneySummary());
    }

    // ── GET /admin/fraud-alerts ───────────────────────────────────
    @GetMapping("/admin/fraud-alerts")
    public ResponseEntity<?> fraudAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = adminService.getFraudAlerts(status, page, size);
        return ResponseEntity.ok(Map.of("alerts", result.getContent(),
                "totalPages", result.getTotalPages(), "total", result.getTotalElements()));
    }

    // ── PUT /admin/fraud-alerts/{alertId}/resolve ─────────────────
    @PutMapping("/admin/fraud-alerts/{alertId}/resolve")
    public ResponseEntity<?> resolveAlert(@PathVariable UUID alertId,
                                           @RequestBody(required = false) Map<String, String> body,
                                           HttpServletRequest req) {
        String resolution = body != null ? body.getOrDefault("resolution", "Reviewed") : "Reviewed";
        return ResponseEntity.ok(adminService.resolveFraudAlert(alertId, uid(req), resolution));
    }

    // ── GET /admin/config ─────────────────────────────────────────
    @GetMapping("/admin/config")
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(Map.of("config", adminService.getSystemConfig()));
    }

    // ── PUT /admin/config/{key} ───────────────────────────────────
    @PutMapping("/admin/config/{key}")
    public ResponseEntity<?> updateConfig(@PathVariable String key,
                                           @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(adminService.updateConfig(key, body.get("value")));
    }

    // ── GET /admin/audit-log ──────────────────────────────────────
    @GetMapping("/admin/audit-log")
    public ResponseEntity<?> auditLog(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        var result = adminService.getAuditLog(page, size);
        return ResponseEntity.ok(Map.of("entries", result.getContent(),
                "totalPages", result.getTotalPages(), "total", result.getTotalElements()));
    }

    // ── GET /admin/reports ────────────────────────────────────────
    @GetMapping("/admin/reports")
    public ResponseEntity<?> reports(
            @RequestParam(defaultValue = "DAILY_SUMMARY") String type,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "JSON") String format) {
        // In production: generate and stream PDF/CSV using JasperReports or Apache POI
        return ResponseEntity.ok(Map.of(
                "reportType", type,
                "generatedAt", java.time.Instant.now().toString(),
                "format", format,
                "message", "Report generation scheduled. Download URL will be emailed."
        ));
    }

    private UUID uid(HttpServletRequest req) {
        Object attr = req.getAttribute("userId");
        return attr != null ? UUID.fromString(attr.toString()) : null;
    }
}
