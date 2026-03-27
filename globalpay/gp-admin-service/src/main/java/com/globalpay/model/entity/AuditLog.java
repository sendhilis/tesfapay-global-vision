package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
@Entity @Table(name="audit_log") @Getter Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(name="actor_id") private UUID actorId;
    @Column(name="actor_role",length=20) private String actorRole;
    @Column(nullable=false,length=50) private String action;
    @Column(name="target_type",length=30) private String targetType;
    @Column(name="target_id") private UUID targetId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb") private Map<String,Object> details;
    @Column(name="created_at",updatable=false) private Instant createdAt=Instant.now();
}
