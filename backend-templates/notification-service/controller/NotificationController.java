package com.globalpay.notification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Notification Controller — user notification inbox.
 *
 * Maps to: API_CONTRACT.md §13 (Notifications)
 * Front-end: Used by WalletHome.tsx (bell icon badge count)
 *
 * Kafka consumer:
 *   Listens to "notification.send" topic → creates notification records
 *   Sources: transfer.completed, kyc.approved, loan.disbursed, etc.
 *
 * Endpoints:
 *   GET /v1/notifications                     → User notifications (paginated)
 *   PUT /v1/notifications/{id}/read           → Mark as read (204)
 */
@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    // private final NotificationService notificationService;

    /** GET /v1/notifications */
    @GetMapping
    public ResponseEntity<?> getNotifications(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // return notificationService.getNotifications(userId, unreadOnly, page, size);
        return ResponseEntity.ok().build();
    }

    /** PUT /v1/notifications/{id}/read — Mark as read */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID notificationId) {
        // notificationService.markAsRead(userId, notificationId);
        return ResponseEntity.noContent().build();
    }
}
