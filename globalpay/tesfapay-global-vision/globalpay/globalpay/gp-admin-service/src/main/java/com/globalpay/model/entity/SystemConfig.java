package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "system_config")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemConfig {
    @Id private String key;
    @Column(nullable = false) private String value;
    @Column(length = 500) private String description;
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate public void onUpdate() { updatedAt = Instant.now(); }
}
