package com.globalpay.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Admin Controller — system management dashboard.
 *
 * Maps to: API_CONTRACT.md §15 (Admin Console APIs)
 * Front-end: AdminDashboard.tsx, AdminUsers.tsx, AdminTransactions.tsx,
 *            AdminKYC.tsx, AdminAgents.tsx, AdminEMoney.tsx,
 *            AdminReports.tsx, AdminAnalytics.tsx
 *
 * Security: ALL endpoints require ROLE_ADMIN
 *
 * Endpoints:
 *   GET  /v1/admin/dashboard                         → System KPIs
 *   GET  /v1/admin/users                             → User management (paginated)
 *   PUT  /v1/admin/users/{id}/status                 → Suspend/activate user
 *   GET  /v1/admin/kyc/pending                       → KYC review queue
 *   PUT  /v1/admin/kyc/{id}/review                   → Approve/reject KYC
 *   GET  /v1/admin/transactions                      → Transaction monitoring
 *   POST /v1/admin/transactions/{id}/reverse          → Reverse transaction
 *   GET  /v1/admin/agents                            → Agent management
 *   PUT  /v1/admin/agents/{id}/float-limit            → Adjust float limit
 *   GET  /v1/admin/emoney                            → E-money trust account
 *   GET  /v1/admin/reports                           → Generate reports
 *   GET  /v1/admin/analytics                         → Analytics data
 */
@RestController
@RequestMapping("/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    // private final AdminService adminService;

    // ========== Dashboard ==========

    /** GET /v1/admin/dashboard — Front-end: AdminDashboard.tsx */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        // Aggregates data from all services via Feign
        // return adminService.getDashboard();
        return ResponseEntity.ok().build();
    }

    // ========== User Management ==========

    /** GET /v1/admin/users — Front-end: AdminUsers.tsx */
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer kycLevel,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // return adminService.getUsers(search, kycLevel, status, page, size);
        return ResponseEntity.ok().build();
    }

    /** PUT /v1/admin/users/{userId}/status — Suspend/activate user */
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable UUID userId,
            @RequestBody Object request) {
        // return adminService.updateUserStatus(userId, request);
        return ResponseEntity.ok().build();
    }

    // ========== KYC Management ==========

    /** GET /v1/admin/kyc/pending — Front-end: AdminKYC.tsx */
    @GetMapping("/kyc/pending")
    public ResponseEntity<?> getPendingKyc(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // return adminService.getPendingKyc(page, size);
        return ResponseEntity.ok().build();
    }

    /** PUT /v1/admin/kyc/{applicationId}/review — Approve/reject KYC */
    @PutMapping("/kyc/{applicationId}/review")
    public ResponseEntity<?> reviewKyc(
            @AuthenticationPrincipal UUID adminId,
            @PathVariable UUID applicationId,
            @RequestBody Object request) {
        // Maker-Checker: second admin may be required for approval
        // return adminService.reviewKyc(adminId, applicationId, request);
        return ResponseEntity.ok().build();
    }

    // ========== Transaction Monitoring ==========

    /** GET /v1/admin/transactions — Front-end: AdminTransactions.tsx */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        // return adminService.getTransactions(type, status, page, size);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/admin/transactions/{id}/reverse — Reverse a transaction */
    @PostMapping("/transactions/{transactionId}/reverse")
    public ResponseEntity<?> reverseTransaction(
            @AuthenticationPrincipal UUID adminId,
            @PathVariable UUID transactionId,
            @RequestBody Object request) {
        // Creates reversal transaction, refunds wallets
        // return adminService.reverseTransaction(adminId, transactionId, request);
        return ResponseEntity.ok().build();
    }

    // ========== Agent Management ==========

    /** GET /v1/admin/agents — Front-end: AdminAgents.tsx */
    @GetMapping("/agents")
    public ResponseEntity<?> getAgents(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "0") int page) {
        // return adminService.getAgents(type, status, region, page);
        return ResponseEntity.ok().build();
    }

    /** PUT /v1/admin/agents/{agentId}/float-limit */
    @PutMapping("/agents/{agentId}/float-limit")
    public ResponseEntity<?> adjustFloatLimit(
            @PathVariable UUID agentId,
            @RequestBody Object request) {
        // return adminService.adjustFloatLimit(agentId, request);
        return ResponseEntity.ok().build();
    }

    // ========== E-Money ==========

    /** GET /v1/admin/emoney — Front-end: AdminEMoney.tsx */
    @GetMapping("/emoney")
    public ResponseEntity<?> getEMoney() {
        // return adminService.getEMoneyOverview();
        return ResponseEntity.ok().build();
    }

    // ========== Reports & Analytics ==========

    /** GET /v1/admin/reports — Front-end: AdminReports.tsx */
    @GetMapping("/reports")
    public ResponseEntity<?> getReports(
            @RequestParam String type,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "JSON") String format) {
        // return adminService.generateReport(type, date, format);
        return ResponseEntity.ok().build();
    }

    /** GET /v1/admin/analytics — Front-end: AdminAnalytics.tsx */
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(
            @RequestParam(defaultValue = "30d") String period) {
        // return adminService.getAnalytics(period);
        return ResponseEntity.ok().build();
    }
}
