package com.globalpay.savings.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Savings Controller — savings goals management.
 *
 * Maps to: API_CONTRACT.md §9 (Savings Goals)
 * Front-end: SavingsGoals.tsx
 *
 * Endpoints:
 *   GET  /v1/savings/goals                    → List goals
 *   POST /v1/savings/goals                    → Create goal (201)
 *   POST /v1/savings/goals/{id}/deposit       → Deposit into goal
 *   POST /v1/savings/goals/{id}/withdraw      → Withdraw from goal
 */
@RestController
@RequestMapping("/v1/savings")
@RequiredArgsConstructor
public class SavingsController {

    // private final SavingsService savingsService;

    /** GET /v1/savings/goals — Front-end: SavingsGoals.tsx goal list */
    @GetMapping("/goals")
    public ResponseEntity<?> getGoals(@AuthenticationPrincipal UUID userId) {
        // return savingsService.getGoals(userId);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/savings/goals — Create new savings goal */
    @PostMapping("/goals")
    public ResponseEntity<?> createGoal(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // return savingsService.createGoal(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** POST /v1/savings/goals/{goalId}/deposit — Deposit from main balance */
    @PostMapping("/goals/{goalId}/deposit")
    public ResponseEntity<?> deposit(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID goalId,
            @RequestBody Object request) {
        // Debit main wallet, credit savings via wallet-service Feign
        // return savingsService.deposit(userId, goalId, request);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/savings/goals/{goalId}/withdraw — Withdraw to main balance */
    @PostMapping("/goals/{goalId}/withdraw")
    public ResponseEntity<?> withdraw(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID goalId,
            @RequestBody Object request) {
        // return savingsService.withdraw(userId, goalId, request);
        return ResponseEntity.ok().build();
    }
}
