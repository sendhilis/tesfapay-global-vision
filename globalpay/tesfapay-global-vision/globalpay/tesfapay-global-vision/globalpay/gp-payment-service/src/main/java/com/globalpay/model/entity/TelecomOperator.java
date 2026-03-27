package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "telecom_operators")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TelecomOperator {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false) private String name;
    @Column(length = 10) private String icon;
    @Column(name = "is_active") private boolean active = true;
    @OneToMany(mappedBy = "operator", fetch = FetchType.LAZY)
    private List<AirtimeBundle> bundles;
}
