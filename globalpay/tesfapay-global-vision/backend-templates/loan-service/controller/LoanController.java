package com.globalpay.loan.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Loan Controller — micro-loan management.
 *
 * Maps to: API_CONTRACT.md §10 (Micro-Loans)
 * Front-end: MicroLoan.tsx
 *
 * Endpoints:
 *   GET  /v1/loans/eligibility         → Check eligibility + AI credit score
 *   GET  /v1/loans/plans?amount=X      → Get repayment plans
 *   POST /v1/loans/apply               → Apply for loan (201)
 *   GET  /v1/loans/active              → Get active loans
 *   POST /v1/loans/{id}/repay          → Make repayment
 */
@RestController
@RequestMapping("/v1/loans")
@RequiredArgsConstructor
public class LoanController {

    // private final LoanService loanService;

    /**
     * GET /v1/loans/eligibility
     * AI-powered credit scoring + loan eligibility check.
     * Front-end: MicroLoan.tsx — credit score circle + eligibility card
     */
    @GetMapping("/eligibility")
    public ResponseEntity<?> checkEligibility(@AuthenticationPrincipal UUID userId) {
        // return loanService.checkEligibility(userId);
        return ResponseEntity.ok().build();
    }

    /** GET /v1/loans/plans?amount=3000 — Repayment plan options */
    @GetMapping("/plans")
    public ResponseEntity<?> getPlans(@RequestParam java.math.BigDecimal amount) {
        // return loanService.calculatePlans(amount);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/loans/apply — Apply for micro-loan */
    @PostMapping("/apply")
    public ResponseEntity<?> applyForLoan(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // Credits wallet via wallet-service Feign, creates loan record
        // return loanService.apply(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** GET /v1/loans/active — Active loan details */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveLoans(@AuthenticationPrincipal UUID userId) {
        // return loanService.getActive(userId);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/loans/{loanId}/repay — Make loan repayment */
    @PostMapping("/{loanId}/repay")
    public ResponseEntity<?> repayLoan(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID loanId,
            @RequestBody Object request) {
        // Debits wallet, updates loan balance
        // return loanService.repay(userId, loanId, request);
        return ResponseEntity.ok().build();
    }
}
