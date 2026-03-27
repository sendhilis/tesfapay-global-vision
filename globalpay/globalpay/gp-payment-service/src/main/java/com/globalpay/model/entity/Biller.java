package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity @Table(name = "billers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Biller {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false) private String name;
    @Column(nullable = false, length = 30) private String category;
    @Column(length = 10) private String icon;
    @Column(length = 500) private String description;
    @Column(name = "is_popular") private boolean popular;
    @Column(name = "requires_account_number") private boolean requiresAccountNumber = true;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private Object fields;
    @Column(name = "api_endpoint") private String apiEndpoint;
    @Column(name = "is_active") private boolean active = true;
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
}
