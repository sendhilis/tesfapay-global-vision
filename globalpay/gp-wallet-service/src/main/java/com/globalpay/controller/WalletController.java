package com.globalpay.controller;

import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class WalletController {

    private final WalletService walletService;

    // ── GET /wallet/balance ──────────────────────────────────────

    @Tag(name = "Wallet")
    @Operation(summary = "Get wallet balances", description = "Returns main, savings, loan balances and loyalty points")
    @GetMapping("/wallet/balance")
    public ResponseEntity<BalanceResponse> getBalance(HttpServletRequest req) {
        UUID userId = resolveUserId(req);
        return ResponseEntity.ok(walletService.getBalance(userId));
    }

    // ── GET /wallet/summary ──────────────────────────────────────

    @Tag(name = "Wallet")
    @Operation(summary = "Dashboard summary", description = "Returns today/weekly in-out and pending request count")
    @GetMapping("/wallet/summary")
    public ResponseEntity<WalletSummaryResponse> getSummary(HttpServletRequest req) {
        UUID userId = resolveUserId(req);
        return ResponseEntity.ok(walletService.getSummary(userId));
    }

    // ── GET /transactions ────────────────────────────────────────

    @Tag(name = "Transactions")
    @Operation(summary = "Transaction history", description = "Paginated, filterable transaction list")
    @GetMapping("/transactions")
    public ResponseEntity<TransactionPageResponse> getTransactions(
            HttpServletRequest req,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID userId = resolveUserId(req);
        return ResponseEntity.ok(walletService.getTransactions(userId, type, status, from, to, page, size));
    }

    // ── GET /transactions/{id} ───────────────────────────────────

    @Tag(name = "Transactions")
    @Operation(summary = "Single transaction detail")
    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(
            @PathVariable UUID transactionId) {
        return ResponseEntity.ok(walletService.getTransaction(transactionId));
    }

    // ── Internal: POST /internal/wallets ─────────────────────────
    // Called by auth-service after registration to provision wallet

    @Tag(name = "Internal")
    @Operation(summary = "Create wallet (internal)", description = "Called by auth-service after user registration")
    @PostMapping("/internal/wallets")
    public ResponseEntity<Void> createWallet(@Valid @RequestBody CreateWalletRequest req) {
        walletService.createWallet(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ── Internal: POST /internal/wallets/debit ───────────────────
    // Called by Transfer, Payment, Agent, Loan, Savings services

    @Tag(name = "Internal")
    @Operation(summary = "Debit wallet (internal)", description = "Used by other microservices to debit a user's wallet")
    @PostMapping("/internal/wallets/debit")
    public ResponseEntity<WalletOperationResponse> debit(@Valid @RequestBody DebitWalletRequest req) {
        return ResponseEntity.ok(walletService.debit(req));
    }

    // ── Internal: POST /internal/wallets/credit ──────────────────

    @Tag(name = "Internal")
    @Operation(summary = "Credit wallet (internal)", description = "Used by other microservices to credit a user's wallet")
    @PostMapping("/internal/wallets/credit")
    public ResponseEntity<WalletOperationResponse> credit(@Valid @RequestBody CreditWalletRequest req) {
        return ResponseEntity.ok(walletService.credit(req));
    }

    // ── Admin: POST /admin/transactions/{id}/reverse ─────────────

    @Tag(name = "Admin")
    @Operation(summary = "Reverse a transaction (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/transactions/{transactionId}/reverse")
    public ResponseEntity<TransactionResponse> reverse(
            @PathVariable UUID transactionId,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Admin reversal") : "Admin reversal";
        return ResponseEntity.ok(walletService.reverseTransaction(transactionId, reason));
    }

    // ── Util ─────────────────────────────────────────────────────

    private UUID resolveUserId(HttpServletRequest req) {
        Object attr = req.getAttribute("userId");
        if (attr == null) throw new org.springframework.security.access.AccessDeniedException("No user context");
        return UUID.fromString(attr.toString());
    }
}
