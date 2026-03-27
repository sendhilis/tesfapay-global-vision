package com.globalpay.service;

import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j @Service @RequiredArgsConstructor
public class UserService {

    private final UserProfileRepository userRepo;
    private final KycApplicationRepository kycRepo;

    @Value("${minio.bucket:kyc-documents}")
    private String minioBucket;

    // ── Profile ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserProfile getProfile(UUID userId) {
        return userRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    @Transactional(readOnly = true)
    public Optional<UserProfile> findByPhone(String phone) {
        return userRepo.findByPhone(phone);
    }

    @Transactional
    public UserProfile updateProfile(UUID userId, Map<String, Object> updates) {
        UserProfile profile = getProfile(userId);
        if (updates.containsKey("firstName"))            profile.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName"))             profile.setLastName((String) updates.get("lastName"));
        if (updates.containsKey("notificationsEnabled")) profile.setNotificationsEnabled((Boolean) updates.get("notificationsEnabled"));
        return userRepo.save(profile);
    }

    @Transactional
    public UserProfile createProfile(UUID userId, String phone, String firstName,
                                      String lastName, String walletId) {
        UserProfile profile = UserProfile.builder()
                .userId(userId).phone(phone).firstName(firstName)
                .lastName(lastName).walletId(walletId).kycLevel((short)1).status("ACTIVE")
                .build();
        return userRepo.save(profile);
    }

    // ── KYC ──────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> submitKyc(UUID userId, String documentType,
                                          String frontUrl, String backUrl,
                                          String selfieUrl, String livenessToken) {
        // Auto-score based on liveness token presence
        int score = livenessToken != null && !livenessToken.isBlank() ? 92 : 65;

        KycApplication app = KycApplication.builder()
                .userId(userId).documentType(documentType)
                .documentFrontUrl(frontUrl).documentBackUrl(backUrl)
                .selfieUrl(selfieUrl).livenessToken(livenessToken)
                .aiVerificationScore(score)
                .status(score >= 80 ? "PROCESSING" : "PENDING")
                .build();
        kycRepo.save(app);

        // Auto-approve if AI score is high enough (configurable in prod)
        if (score >= 80) {
            app.setStatus("APPROVED");
            kycRepo.save(app);
            UserProfile profile = getProfile(userId);
            profile.setKycLevel((short) 2);
            profile.setDailyLimit(new java.math.BigDecimal("50000.00"));
            profile.setMonthlyLimit(new java.math.BigDecimal("200000.00"));
            userRepo.save(profile);
        }

        return Map.of("applicationId", app.getId(), "status", app.getStatus(),
                "estimatedTime", score >= 80 ? "Auto-approved" : "2-3 business days");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getKycStatus(UUID userId) {
        UserProfile profile = getProfile(userId);
        Optional<KycApplication> latest = kycRepo.findTopByUserIdOrderBySubmittedAtDesc(userId);
        return Map.of(
                "kycLevel", profile.getKycLevel(),
                "status", latest.map(KycApplication::getStatus).orElse("NOT_APPLIED"),
                "dailyLimit", profile.getDailyLimit(),
                "monthlyLimit", profile.getMonthlyLimit()
        );
    }

    // ── Admin: search users ───────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<UserProfile> searchUsers(String search, String status, Short kycLevel, int page, int size) {
        return userRepo.searchUsers(search, status, kycLevel, PageRequest.of(page, size));
    }

    // ── Admin: update user status ─────────────────────────────────

    @Transactional
    public UserProfile updateStatus(UUID userId, String status) {
        UserProfile profile = getProfile(userId);
        profile.setStatus(status);
        return userRepo.save(profile);
    }

    // ── Admin: pending KYC ────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<KycApplication> getPendingKyc(int page, int size) {
        return kycRepo.findByStatusOrderBySubmittedAtAsc("PENDING", PageRequest.of(page, size));
    }

    // ── Admin: approve/reject KYC ─────────────────────────────────

    @Transactional
    public Map<String, Object> reviewKyc(UUID applicationId, String decision, String note, UUID adminId) {
        KycApplication app = kycRepo.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("KYC application not found"));
        app.setStatus(decision);
        app.setReviewNote(note);
        app.setReviewerAdminId(adminId);
        app.setReviewedAt(java.time.Instant.now());
        kycRepo.save(app);

        if ("APPROVED".equals(decision)) {
            UserProfile profile = getProfile(app.getUserId());
            profile.setKycLevel((short) 2);
            profile.setDailyLimit(new java.math.BigDecimal("50000.00"));
            profile.setMonthlyLimit(new java.math.BigDecimal("200000.00"));
            userRepo.save(profile);
        }

        return Map.of("id", app.getId(), "status", app.getStatus(),
                "newKycLevel", "APPROVED".equals(decision) ? 2 : 1);
    }
}
