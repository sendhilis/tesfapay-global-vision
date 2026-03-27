package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="fraud_alerts") @Getter Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FraudAlert {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(name="user_id") private UUID userId;
    @Column(nullable=false,length=10) private String severity;
    @Column(name="alert_type",nullable=false,length=30) private String alertType;
    @Column(nullable=false,columnDefinition="TEXT") private String message;
    @Column(nullable=false,length=20) private String status="OPEN";
    @Column(name="reviewed_by") private UUID reviewedBy;
    @Column(name="created_at",updatable=false) private Instant createdAt=Instant.now();
}
