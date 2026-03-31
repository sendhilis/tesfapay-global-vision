package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@Entity @Table(name = "credit_scores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreditScore {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false, unique = true) private UUID userId;
    @Column(nullable = false) private int score;
    @Column(nullable = false, length = 20) private String label;
    @Column(name = "max_loan", nullable = false, precision = 18, scale = 2) private BigDecimal maxLoan;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") private List<Map<String, Object>> factors;
    @Column(name = "computed_at", updatable = false) private Instant computedAt = Instant.now();
}