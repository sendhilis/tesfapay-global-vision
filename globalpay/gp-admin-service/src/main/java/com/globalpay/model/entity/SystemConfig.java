package com.globalpay.model.entity;
import jakarta.persistence.*; import lombok.*; import java.time.Instant;
@Entity @Table(name = "system_config") @Getter @Setter @NoArgsConstructor @AllArgsConstructor BBuilder
public class SystemConfig {
    @Id private String key;
    @Column(nullable = false) private String value;
    @Column(length = 500) private String description;
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
}
