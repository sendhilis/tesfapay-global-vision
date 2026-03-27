package com.globalpay.controller;

import com.globalpay.service.SavingsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController @RequiredArgsConstructor
public class SavingsController {

    private final SavingsService savingsService;

    @GetMapping("/savings/goals")
    public ResponseEntity<?> getGoals(HttpServletRequest req) {
        return ResponseEntity.ok(savingsService.getGoals(uid(req)));
    }

    @PostMapping("/savings/goals")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        return ResponseEntity.status(201).body(savingsService.createGoal(uid(req),
                (String) body.get("name"), (String) body.get("icon"),
                new BigDecimal(body.get("targetAmount").toString()), (String) body.get("deadline")));
    }

    @PostMapping("/savings/goals/{goalId}/deposit")
    public ResponseEntity<?> deposit(@PathVariable UUID goalId,
                                      @RequestBody Map<String, Object> body, HttpServletRequest req) {
        return ResponseEntity.ok(savingsService.deposit(uid(req), goalId,
                new BigDecimal(body.get("amount").toString())));
    }

    @PostMapping("/savings/goals/{goalId}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable UUID goalId,
                                       @RequestBody Map<String, Object> body, HttpServletRequest req) {
        return ResponseEntity.ok(savingsService.withdraw(uid(req), goalId,
                new BigDecimal(body.get("amount").toString())));
    }

    @DeleteMapping("/savings/goals/{goalId}")
    public ResponseEntity<Void> delete(@PathVariable UUID goalId, HttpServletRequest req) {
        savingsService.deleteGoal(uid(req), goalId);
        return ResponseEntity.noContent().build();
    }

    private UUID uid(HttpServletRequest req) {
        return UUID.fromString(req.getAttribute("userId").toString());
    }
}
