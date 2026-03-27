package com.globalpay.service;

import com.globalpay.model.entity.*;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

// ── Repositories ────────────────────────────────────────────────

@Repository interface LoyaltyAccountRepository extends JpaRepository<LoyaltyAccount, UUID> {
    Optional<LoyaltyAccount> findByUserId(UUID userId);
}
@Repository interface LoyaltyHistoryRepository extends JpaRepository<LoyaltyHistory, UUID> {
    Page<LoyaltyHistory> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
@Repository interface RedemptionCatalogRepository extends JpaRepository<RedemptionCatalog, UUID> {
    List<RedemptionCatalog> findByActiveTrue();
}
@Repository interface RedemptionRepository extends JpaRepository<com.globalpay.model.entity.Redemption, UUID> {}

// ── Service ──────────────────────────────────────────────────────

@Slf4j @Service @RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyAccountRepository accountRepo;
    private final LoyaltyHistoryRepository historyRepo;
    private final RedemptionCatalogRepository catalogRepo;
    private final RedemptionRepository redemptionRepo;

    private static final Map<String, int[]> TIER_THRESHOLDS = Map.of(
            "BRONZE",   new int[]{0,    999},
            "SILVER",   new int[]{1000, 4999},
            "GOLD",     new int[]{5000, 19999},
            "PLATINUM", new int[]{20000, Integer.MAX_VALUE}
    );

    @Transactional(readOnly = true)
    public Map<String, Object> getLoyalty(UUID userId) {
        LoyaltyAccount account = getOrCreate(userId);
        int points = account.getPoints();
        int toNextTier = toNextTier(points, account.getTier());
        int pct = progressPct(points, account.getTier());

        return Map.of(
                "points", points,
                "pointsValue", BigDecimal.valueOf(points).multiply(new BigDecimal("0.05")),
                "tier", account.getTier(),
                "tierThresholds", TIER_THRESHOLDS,
                "progressToNextTier", pct,
                "pointsToNextTier", toNextTier
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID userId, int page, int size) {
        Page<LoyaltyHistory> p = historyRepo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        return Map.of("entries", p.getContent(), "page", page, "totalPages", p.getTotalPages(), "totalEntries", p.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRedemptions(UUID userId) {
        LoyaltyAccount account = getOrCreate(userId);
        List<RedemptionCatalog> catalog = catalogRepo.findByActiveTrue();
        List<Map<String, Object>> items = catalog.stream().map(c -> {
            boolean available = c.getMinTier() == null || tierRank(account.getTier()) >= tierRank(c.getMinTier());
            return Map.of("id", c.getId(), "name", c.getName(), "pointsCost", c.getPointsCost(),
                    "icon", c.getIcon() != null ? c.getIcon() : "", "available", available);
        }).toList();
        return Map.of("redemptions", items);
    }

    @Transactional
    public Map<String, Object> redeem(UUID userId, UUID catalogItemId) {
        LoyaltyAccount account = getOrCreate(userId);
        RedemptionCatalog item = catalogRepo.findById(catalogItemId)
                .orElseThrow(() -> new RuntimeException("Redemption item not found"));

        if (account.getPoints() < item.getPointsCost())
            throw new RuntimeException("Insufficient loyalty points");

        account.setPoints(account.getPoints() - item.getPointsCost());
        updateTier(account);
        accountRepo.save(account);

        historyRepo.save(LoyaltyHistory.builder().userId(userId)
                .label("Cashback Redemption – " + item.getName())
                .points(-item.getPointsCost()).build());

        return Map.of("success", true, "rewardName", item.getName(),
                "pointsDeducted", item.getPointsCost(), "remainingPoints", account.getPoints(),
                "cashbackAmount", item.getRewardValue() != null ? item.getRewardValue() : BigDecimal.ZERO);
    }

    // ── Kafka: award points when transactions complete ────────────

    @KafkaListener(topics = "transfer.completed", groupId = "loyalty-service")
    @Transactional
    public void onTransferCompleted(Map<String, Object> event) {
        try {
            String senderId = (String) event.get("senderId");
            if (senderId == null) return;
            BigDecimal amount = new BigDecimal(event.get("amount").toString());
            int points = amount.multiply(new BigDecimal("0.1")).intValue();
            awardPoints(UUID.fromString(senderId), points, "P2P Transfer", null);
        } catch (Exception e) { log.error("Loyalty event error: {}", e.getMessage()); }
    }

    @KafkaListener(topics = "payment.completed", groupId = "loyalty-service")
    @Transactional
    public void onPaymentCompleted(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            if (userId == null) return;
            BigDecimal amount = new BigDecimal(event.get("amount").toString());
            int points = amount.multiply(new BigDecimal("0.1")).intValue();
            awardPoints(UUID.fromString(userId), points, "Bill/Airtime Payment", null);
        } catch (Exception e) { log.error("Loyalty event error: {}", e.getMessage()); }
    }

    // ── Helpers ──────────────────────────────────────────────────

    public void awardPoints(UUID userId, int points, String label, UUID txnId) {
        LoyaltyAccount account = getOrCreate(userId);
        account.setPoints(account.getPoints() + points);
        updateTier(account);
        accountRepo.save(account);
        historyRepo.save(LoyaltyHistory.builder().userId(userId).transactionId(txnId)
                .label(label).points(points).build());
    }

    private LoyaltyAccount getOrCreate(UUID userId) {
        return accountRepo.findByUserId(userId).orElseGet(() ->
                accountRepo.save(LoyaltyAccount.builder().userId(userId).points(0).tier("BRONZE").build()));
    }

    private void updateTier(LoyaltyAccount account) {
        int p = account.getPoints();
        if      (p >= 20000) account.setTier("PLATINUM");
        else if (p >= 5000)  account.setTier("GOLD");
        else if (p >= 1000)  account.setTier("SILVER");
        else                 account.setTier("BRONZE");
    }

    private int toNextTier(int points, String tier) {
        return switch (tier) {
            case "BRONZE"   -> Math.max(0, 1000 - points);
            case "SILVER"   -> Math.max(0, 5000 - points);
            case "GOLD"     -> Math.max(0, 20000 - points);
            default         -> 0;
        };
    }

    private int progressPct(int points, String tier) {
        int[] range = TIER_THRESHOLDS.getOrDefault(tier, new int[]{0, 1000});
        if (range[1] == Integer.MAX_VALUE) return 100;
        int span = range[1] - range[0];
        return span == 0 ? 100 : Math.min(100, (points - range[0]) * 100 / span);
    }

    private int tierRank(String tier) {
        return switch (tier) { case "SILVER" -> 1; case "GOLD" -> 2; case "PLATINUM" -> 3; default -> 0; };
    }
}
