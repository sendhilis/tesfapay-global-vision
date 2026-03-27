package com.globalpay.controller;

import com.globalpay.service.LoanService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController @RequiredArgsConstructor
public class LoanController {
    private final LoanService loanService;

    @GetMapping("/loans/eligibility")
    public ResponseEntity<?> eligibility(HttpServletRequest req) {
        return ResponseEntity.ok(loanService.checkEligibility(uid(req)));
    }

    @GetMapping("/loans/plans")
    public ResponseEntity<?> plans(@RequestParam BigDecimal amount) {
        return ResponseEntity.ok(loanService.getPlans(amount));
    }

    @PostMapping("/loans/apply")
    public ResponseEntity<?> apply(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        return ResponseEntity.status(201).body(loanService.applyForLoan(uid(req),
                new BigDecimal(body.get("amount").toString()),
                Integer.parseInt(body.get("termMonths").toString()),
                (String) body.getOrDefault("purpose", "")));
    }

    @GetMapping("/loans/active")
    public ResponseEntity<?> active(HttpServletRequest req) {
        return ResponseEntity.ok(loanService.getActiveLoans(uid(req)));
    }

    @PostMapping("/loans/{loanId}/repay")
    public ResponseEntity<?> repay(@PathVariable UUID loanId,
                                    @RequestBody Map<String, Object> body, HttpServletRequest req) {
        return ResponseEntity.ok(loanService.repay(uid(req), loanId,
                new BigDecimal(body.get("amount").toString())));
    }

    private UUID uid(HttpServletRequest req) {
        return UUID.fromString(req.getAttribute("userId").toString());
    }
}
