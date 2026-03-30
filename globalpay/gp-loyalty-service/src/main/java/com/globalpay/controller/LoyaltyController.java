package com.globalpay.controller;

import com.globalpay.service.LoyaltyService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequiredArgsConstructor
public class LoyaltyController {
    private final LoyaltyService loyaltyService;

    @GetMapping("/loyalty")
    public ResponseEntity<?> getLoyalty(HttpServletRequest req) {
        return ResponseEntity.ok(loyaltyService.getLoyalty(uid(req)));
    }

    @GetMapping("/loyalty/history")
    public ResponseEntity<?> getHistory(HttpServletRequest req,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(loyaltyService.getHistory(uid(req), page, size));
    }

    @GetMapping("/loyalty/catalog")
    public ResponseEntity<?> getCatalog() {
        return ResponseEntity.ok(loyaltyService.getCatalog());
    }

    @GetMapping("/loyalty/redemptions")
    public ResponseEntity<?> getRedemptions(HttpServletRequest req) {
        return ResponseEntity.ok(loyaltyService.getRedemptions(uid(req)));
    }

    @PostMapping("/loyalty/redeem/{itemId}")
    public ResponseEntity<?> redeem(HttpServletRequest req, @PathVariable UUID itemId) {
        return ResponseEntity.ok(loyaltyService.redeem(uid(req), itemId));
    }

    private UUID uid(HttpServletRequest req) {
        return UUID.fromString(req.getHeader("X-User-Id"));
    }
}
