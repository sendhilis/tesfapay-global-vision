package com.globalpay.service;

import com.globalpay.model.entity.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@org.springframework.stereotype.Repository
interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    long countByUserIdAndReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.id = :id")
    void markAsRead(UUID id);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.userId = :userId")
    void markAllAsRead(UUID userId);
}

@Slf4j @Service @RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifRepo;

    // ── REST: fetch notifications ────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getNotifications(UUID userId, boolean unreadOnly, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> p = unreadOnly
                ? notifRepo.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notifRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return Map.of("notifications", p.getContent(),
                "unreadCount", notifRepo.countByUserIdAndReadFalse(userId));
    }

    @Transactional
    public void markRead(UUID notifId) {
        notifRepo.markAsRead(notifId);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notifRepo.markAllAsRead(userId);
    }

    // ── Internal: create notification ────────────────────────────

    @Transactional
    public Notification create(UUID userId, String type, String title, String message) {
        return notifRepo.save(Notification.builder()
                .userId(userId).type(type).title(title).message(message).read(false).build());
    }

    // ── Kafka listeners ──────────────────────────────────────────

    @KafkaListener(topics = "transfer.completed", groupId = "notification-service")
    public void onTransfer(Map<String, Object> event) {
        try {
            String senderId    = (String) event.get("senderId");
            String recipientId = (String) event.get("recipientId");
            String amount      = (String) event.get("amount");
            String ref         = (String) event.getOrDefault("reference", "");

            if (senderId != null)
                create(UUID.fromString(senderId), "TRANSACTION",
                        "Money Sent", "You sent ETB " + amount + ". Ref: " + ref);
            if (recipientId != null)
                create(UUID.fromString(recipientId), "TRANSACTION",
                        "Money Received", "You received ETB " + amount + ". Ref: " + ref);
        } catch (Exception e) { log.error("Notification error (transfer): {}", e.getMessage()); }
    }

    @KafkaListener(topics = "payment.completed", groupId = "notification-service")
    public void onPayment(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            String amount = (String) event.get("amount");
            String type   = (String) event.getOrDefault("type", "Payment");
            if (userId != null)
                create(UUID.fromString(userId), "TRANSACTION",
                        type + " Successful", "ETB " + amount + " payment completed.");
        } catch (Exception e) { log.error("Notification error (payment): {}", e.getMessage()); }
    }

    @KafkaListener(topics = "loan.disbursed", groupId = "notification-service")
    public void onLoanDisbursed(Map<String, Object> event) {
        try {
            String userId = event.get("userId").toString();
            String amount = event.get("amount").toString();
            create(UUID.fromString(userId), "LOAN",
                    "Loan Disbursed", "ETB " + amount + " has been credited to your wallet.");
        } catch (Exception e) { log.error("Notification error (loan): {}", e.getMessage()); }
    }

    @KafkaListener(topics = "agent.cashin", groupId = "notification-service")
    public void onCashIn(Map<String, Object> event) {
        try {
            String customerId = event.get("customerId").toString();
            String amount     = event.get("amount").toString();
            create(UUID.fromString(customerId), "TRANSACTION",
                    "Cash-In Successful", "ETB " + amount + " deposited to your wallet via agent.");
        } catch (Exception e) { log.error("Notification error (cashin): {}", e.getMessage()); }
    }

    @KafkaListener(topics = "agent.cashout", groupId = "notification-service")
    public void onCashOut(Map<String, Object> event) {
        try {
            String customerId = event.get("customerId").toString();
            String amount     = event.get("amount").toString();
            create(UUID.fromString(customerId), "TRANSACTION",
                    "Cash-Out Successful", "ETB " + amount + " withdrawn via agent.");
        } catch (Exception e) { log.error("Notification error (cashout): {}", e.getMessage()); }
    }

    @KafkaListener(topics = "savings.deposited", groupId = "notification-service")
    public void onSavingsDeposit(Map<String, Object> event) {
        try {
            String userId = event.get("userId").toString();
            String amount = event.get("amount").toString();
            create(UUID.fromString(userId), "TRANSACTION",
                    "Savings Updated", "ETB " + amount + " deposited to your savings goal.");
        } catch (Exception e) { log.error("Notification error (savings): {}", e.getMessage()); }
    }
}
