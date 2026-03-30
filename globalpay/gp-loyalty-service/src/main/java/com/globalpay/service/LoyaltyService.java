package com.globalpay.service;

import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor
public class LoyaltyService {
    private final LoyaltyAccountRepository loyaltyRepo;
    private final LoyaltyHistoryRepository historyRepo;
    private final RedemptionCatalogRepository catalogRepo;
    private final RedemptionRepository redemptionRepo;

    public Map<String, Object> getLoyalty(UUID userId) {
        Optional<LoyaltyAccount> account = loyaltyRepo.findByUserId(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("points", account.map(LoyaltyAccount::getPoints).orElse(0));
        result.put("tier", account.map(LoyaltyAccount::getTier).orElse("BRONZE"));
        return result;
    }

    public Map<String, Object> getHistory(UUID userId, int page, int size) {
        Page<LoyaltyHistory> history = historyRepo.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
        Map<String, Object> result = new HashMap<>();
        result.put("content", history.getContent().stream().map(h -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", h.getId());
            m.put("points", h.getPoints());
            m.put("label", h.getLabel());
            m.put("createdAt", h.getCreatedAt());
            return m;
        }).collect(Collectors.toList()));
        result.put("totalElements", history.getTotalElements());
        result.put("totalPages", history.getTotalPages());
        return result;
    }

    public List<Map<String, Object>> getCatalog() {
        return catalogRepo.findAll().stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("pointsCost", c.getPointsCost());
            m.put("rewardType", c.getRewardType());
            m.put("active", c.isActive());
            return m;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRedemptions(UUID userId) {
        return redemptionRepo.findByUserIdOrderByCreatedAtDesc(userId).stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("rewardName", r.getRewardName());
            m.put("pointsSpent", r.getPointsSpent());
            m.put("status", r.getStatus());
            m.put("createdAt", r.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> redeem(UUID userId, UUID itemId) {
        LoyaltyAccount account = loyaltyRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Loyalty account not found"));
        RedemptionCatalog item = catalogRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        if (account.getPoints() < item.getPointsCost()) throw new RuntimeException("Insufficient points");
        account.setPoints(account.getPoints() - item.getPointsCost());
        loyaltyRepo.save(account);
        Redemption r = new Redemption();
        r.setUserId(userId); r.setCatalogItemId(itemId);
        r.setPointsSpent(item.getPointsCost()); r.setRewardName(item.getName());
        r.setStatus("COMPLETED"); r.setCreatedAt(Instant.now());
        redemptionRepo.save(r);
        return Map.of("success", true, "pointsRemaining", account.getPoints());
    }

    @Transactional
    public void awardPoints(UUID userId, int points, String label) {
        LoyaltyAccount a = loyaltyRepo.findByUserId(userId).orElseGet(() -> {
            LoyaltyAccount x = new LoyaltyAccount();
            x.setUserId(userId); x.setPoints(0); x.setTier("BRONZE");
            x.setUpdatedAt(Instant.now()); return x;
        });
        a.setPoints(a.getPoints() + points);
        loyaltyRepo.save(a);
        LoyaltyHistory h = new LoyaltyHistory();
        h.setUserId(userId); h.setPoints(points); h.setLabel(label);
        h.setCreatedAt(Instant.now());
        historyRepo.save(h);
    }
}
