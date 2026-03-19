package com.globalpay.auth.entity;

import com.globalpay.common.enums.AppRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * User role entity — maps to DATABASE_SCHEMA.md §2 (user_roles table).
 * RBAC: Roles stored SEPARATELY from users to prevent privilege escalation.
 */
@Entity
@Table(name = "user_roles", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppRole role;
}
