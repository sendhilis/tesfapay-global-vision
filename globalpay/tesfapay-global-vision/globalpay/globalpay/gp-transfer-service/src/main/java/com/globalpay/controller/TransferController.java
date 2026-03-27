package com.globalpay.controller;

import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Transfers", description = "P2P send money, request money, contacts")
public class TransferController {

    private final TransferService transferService;

    // ── POST /contacts/lookup ────────────────────────────────────

    @Operation(summary = "Look up user by phone")
    @PostMapping("/contacts/lookup")
    public ResponseEntity<ContactLookupResponse> lookupContact(
            @Valid @RequestBody ContactLookupRequest req) {
        return ResponseEntity.ok(transferService.lookupContact(req.getPhone()));
    }

    // ── GET /contacts ────────────────────────────────────────────

    @Operation(summary = "Get saved contacts / favourites")
    @GetMapping("/contacts")
    public ResponseEntity<Map<String, List<ContactResponse>>> getContacts(HttpServletRequest req) {
        UUID userId = resolveUserId(req);
        return ResponseEntity.ok(Map.of("contacts", transferService.getContacts(userId)));
    }

    // ── GET /transfers/fee-preview ───────────────────────────────

    @Operation(summary = "Preview transfer fee")
    @GetMapping("/transfers/fee-preview")
    public ResponseEntity<FeeLookupResponse> feePreview(
            @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(transferService.feePreview(amount));
    }

    // ── POST /transfers/send ─────────────────────────────────────

    @Operation(summary = "Send money P2P",
               description = "Executes debit→credit saga with automatic compensation on failure")
    @PostMapping("/transfers/send")
    public ResponseEntity<SendMoneyResponse> send(
            HttpServletRequest req,
            @Valid @RequestBody SendMoneyRequest body) {

        UUID   userId    = resolveUserId(req);
        String walletId  = (String) req.getAttribute("walletId");
        int    kycLevel  = resolveKycLevel(req);

        SendMoneyResponse response = transferService.send(userId, walletId, kycLevel, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── POST /transfers/request ──────────────────────────────────

    @Operation(summary = "Request money from another user")
    @PostMapping("/transfers/request")
    public ResponseEntity<MoneyRequestResponse> requestMoney(
            HttpServletRequest req,
            @Valid @RequestBody RequestMoneyRequest body) {

        UUID   userId = resolveUserId(req);
        String phone  = (String) req.getAttribute("phone");

        MoneyRequestResponse response = transferService.requestMoney(userId, phone, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── GET /transfers/requests ──────────────────────────────────

    @Operation(summary = "List pending money requests",
               description = "Pass direction=incoming (default) or direction=outgoing")
    @GetMapping("/transfers/requests")
    public ResponseEntity<Map<String, List<MoneyRequestResponse>>> getPendingRequests(
            HttpServletRequest req,
            @RequestParam(defaultValue = "incoming") String direction) {

        UUID userId = resolveUserId(req);
        return ResponseEntity.ok(Map.of(
                "requests", transferService.getPendingRequests(userId, direction)));
    }

    // ── PUT /transfers/requests/{requestId} ──────────────────────

    @Operation(summary = "Accept or decline a money request")
    @PutMapping("/transfers/requests/{requestId}")
    public ResponseEntity<MoneyRequestResponse> respondToRequest(
            HttpServletRequest req,
            @PathVariable UUID requestId,
            @Valid @RequestBody RespondToRequestRequest body) {

        UUID   userId   = resolveUserId(req);
        String walletId = (String) req.getAttribute("walletId");
        int    kycLevel = resolveKycLevel(req);

        return ResponseEntity.ok(
                transferService.respondToRequest(userId, walletId, kycLevel, requestId, body));
    }

    // ── Helpers ──────────────────────────────────────────────────

    private UUID resolveUserId(HttpServletRequest req) {
        Object attr = req.getAttribute("userId");
        if (attr == null) throw new org.springframework.security.access.AccessDeniedException("No auth context");
        return UUID.fromString(attr.toString());
    }

    private int resolveKycLevel(HttpServletRequest req) {
        // kycLevel is embedded in the JWT and extracted by JwtAuthFilter if you add it
        // For now default to 1; extend JwtAuthFilter to set attribute "kycLevel"
        Object attr = req.getAttribute("kycLevel");
        return attr != null ? Integer.parseInt(attr.toString()) : 1;
    }
}
