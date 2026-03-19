package com.globalpay.transfer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Contact entity — user's saved contacts/favorites.
 * Maps to: DATABASE_SCHEMA.md §2 (contacts table)
 * Front-end: SendMoney.tsx, RequestMoney.tsx
 * API: GET /contacts, POST /contacts/lookup
 */
@Entity
@Table(name = "contacts", uniqueConstraints =
    @UniqueConstraint(columnNames = {"owner_user_id", "contact_phone"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "contact_user_id")
    private UUID contactUserId;

    @Column(name = "contact_name", nullable = false, length = 200)
    private String contactName;

    @Column(name = "contact_phone", nullable = false, length = 20)
    private String contactPhone;

    @Column(name = "is_favorite", nullable = false)
    @Builder.Default
    private Boolean isFavorite = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
