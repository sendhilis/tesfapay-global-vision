package com.globalpay.loyalty.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Loyalty Controller — points, tiers, and reward redemption.
 *
 * Maps to: API_CONTRACT.md §11 (Loyalty & Rewards)
 * Front-end: LoyaltyRewards.tsx
 *
 * Endpoints:
 *   GET  /v1/loyalty                → Points overview + tier info
 *   GET  /v1/loyalty/history        → Points transaction history
 *   GET  /v1/loyalty/redemptions    → Available rewards catalog
 *   POST /v1/loyalty/redeem         → Redeem a reward
 *
 * Kafka consumer:
 *   Listens to "transfer.completed" topic → awards loyalty points automatically
 */
@RestController
@RequestMapping("/v1/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    // private final LoyaltyService loyaltyService;

    /** GET /v1/loyalty — Front-end: LoyaltyRewards.tsx overview tab */
    @GetMapping
    public ResponseEntity<?> getLoyaltyOverview(@AuthenticationPrincipal UUID userId) {
        // return loyaltyService.getOverview(userId);
        return ResponseEntity.ok().build();
    }

    /** GET /v1/loyalty/history — Points earned/spent log */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // return loyaltyService.getHistory(userId, page, size);
        return ResponseEntity.ok().build();
    }

    /** GET /v1/loyalty/redemptions — Available rewards catalog */
    @GetMapping("/redemptions")
    public ResponseEntity<?> getRedemptions(@AuthenticationPrincipal UUID userId) {
        // return loyaltyService.getAvailableRedemptions(userId);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/loyalty/redeem — Redeem a reward */
    @PostMapping("/redeem")
    public ResponseEntity<?> redeemReward(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // return loyaltyService.redeem(userId, request);
        return ResponseEntity.ok().build();
    }
}
