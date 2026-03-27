package com.globalpay.controller;

import com.globalpay.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController @RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── GET /users/me ─────────────────────────────────────────────
    @GetMapping("/users/me")
    public ResponseEntity<?> getMe(HttpServletRequest req) {
        return ResponseEntity.ok(userService.getProfile(uid(req)));
    }

    // ── PUT /users/me ─────────────────────────────────────────────
    @PutMapping("/users/me")
    public ResponseEntity<?> updateMe(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        return ResponseEntity.ok(userService.updateProfile(uid(req), body));
    }

    // ── POST /users/me/kyc/upgrade ────────────────────────────────
    @PostMapping("/users/me/kyc/upgrade")
    public ResponseEntity<?> submitKyc(
            @RequestParam String documentType,
            @RequestParam(required = false) String documentFrontUrl,
            @RequestParam(required = false) String documentBackUrl,
            @RequestParam(required = false) String selfieUrl,
            @RequestParam(required = false) String livenessToken,
            HttpServletRequest req) {
        // In production: receive MultipartFile, upload to MinIO, get URL back
        // For simplicity, accept URL strings directly
        var result = userService.submitKyc(uid(req), documentType,
                documentFrontUrl != null ? documentFrontUrl : "pending",
                documentBackUrl, selfieUrl != null ? selfieUrl : "pending", livenessToken);
        return ResponseEntity.status(202).body(result);
    }

    // ── GET /users/me/kyc/status ──────────────────────────────────
    @GetMapping("/users/me/kyc/status")
    public ResponseEntity<?> kycStatus(HttpServletRequest req) {
        return ResponseEntity.ok(userService.getKycStatus(uid(req)));
    }

    // ── Internal: GET /internal/users/phone/{phone} ───────────────
    @GetMapping("/internal/users/phone/{phone}")
    public ResponseEntity<?> findByPhone(@PathVariable String phone) {
        return userService.findByPhone(phone)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Internal: GET /internal/users/{userId} ────────────────────
    @GetMapping("/internal/users/{userId}")
    public ResponseEntity<?> findById(@PathVariable UUID userId) {
        try { return ResponseEntity.ok(userService.getProfile(userId)); }
        catch (Exception e) { return ResponseEntity.notFound().build(); }
    }

    // ── Admin: GET /admin/users ───────────────────────────────────
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminGetUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Short kycLevel,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = userService.searchUsers(search, status, kycLevel, page, size);
        return ResponseEntity.ok(Map.of("users", result.getContent(),
                "page", page, "totalPages", result.getTotalPages(), "totalUsers", result.getTotalElements()));
    }

    // ── Admin: PUT /admin/users/{userId}/status ───────────────────
    @PutMapping("/admin/users/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable UUID userId, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.updateStatus(userId, body.get("status")));
    }

    // ── Admin: GET /admin/kyc/pending ────────────────────────────
    @GetMapping("/admin/kyc/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> pendingKyc(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = userService.getPendingKyc(page, size);
        return ResponseEntity.ok(Map.of("applications", result.getContent(), "totalPending", result.getTotalElements()));
    }

    // ── Admin: PUT /admin/kyc/{applicationId}/review ──────────────
    @PutMapping("/admin/kyc/{applicationId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reviewKyc(@PathVariable UUID applicationId,
                                        @RequestBody Map<String, String> body, HttpServletRequest req) {
        return ResponseEntity.ok(userService.reviewKyc(applicationId,
                body.get("decision"), body.get("note"), uid(req)));
    }

    private UUID uid(HttpServletRequest req) {
        return UUID.fromString(req.getAttribute("userId").toString());
    }
}
