package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "airtime_bundles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AirtimeBundle {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "operator_id") private TelecomOperator operator;
    @Column(nullable = false) private String name;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal price;
    @Column(nullable = false, length = 30) private String validity;
    @Column(nullable = false, length = 10) private String type;  // DATA | AIRTIME
    @Column(name = "sort_order") private int sortOrder;
    @Column(name = "is_active") private boolean active = true;
}
