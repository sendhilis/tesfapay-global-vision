package com.globalpay.wallet.controller;

import com.globalpay.wallet.dto.BalanceResponse;
import com.globalpay.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Wallet Controller — balance and wallet management.
 *
 * Maps to: API_CONTRACT.md §3 (Wallet & Balance)
 * Front-end: WalletHome.tsx
 *
 * Endpoints:
 *   GET /v1/wallet/balance   → BalanceResponse
 *   GET /v1/wallet/summary   → SummaryResponse
 */
@RestController
@RequestMapping("/v1/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    /**
     * GET /v1/wallet/balance
     * Get wallet balances for authenticated user.
     *
     * Front-end: WalletHome.tsx — balance card shows mainBalance, savingsBalance
     * Response: { mainBalance, savingsBalance, loanBalance, loyaltyPoints, currency, lastUpdated }
     */
    @GetMapping("/balance")
    public ResponseEntity<BalanceResponse> getBalance(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(walletService.getBalance(userId));
    }

    /**
     * GET /v1/wallet/summary
     * Dashboard summary with today/weekly in/out totals.
     *
     * Front-end: WalletHome.tsx — "Today" / "This Week" summary cards
     * Response: { todayIn, todayOut, weeklyIn, weeklyOut, pendingRequests }
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@AuthenticationPrincipal UUID userId) {
        // TODO: Implement — aggregate from transaction-service via Feign
        return ResponseEntity.ok().build();
    }
}
