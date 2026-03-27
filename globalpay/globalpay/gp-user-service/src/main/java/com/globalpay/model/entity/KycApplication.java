package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "kyc_applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KycApplication {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "document_type", nullable = false, length = 20) private String documentType;
    @Column(name = "document_front_url", nullable = false) private String documentFrontUrl;
    @Column(name = "document_back_url") private String documentBackUrl;
    @Column(name = "selfie_url", nullable = false) private String selfieUrl;
    @Column(name = "liveness_token") private String livenessToken;
    @Column(name = "ai_verification_score") private Integer aiVerificationScore;
    @Column(nullable = false, length = 20) private String status = "PENDING";
    @Column(name = "reviewer_admin_id") private UUID reviewerAdminId;
    @Column(name = "review_note") private String reviewNote;
    @Column(name = "submitted_at", updatable = false) private Instant submittedAt = Instant.now();
    @Column(name = "reviewed_at") private Instant reviewedAt;
}
