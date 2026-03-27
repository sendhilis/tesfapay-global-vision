package com.globalpay.transfer.controller;

import com.globalpay.transfer.dto.*;
import com.globalpay.transfer.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Transfer Controller — P2P money transfers and contacts.
 *
 * Maps to: API_CONTRACT.md §4 (P2P Transfers)
 * Front-end: SendMoney.tsx, RequestMoney.tsx
 *
 * Endpoints:
 *   GET  /v1/contacts                          → Contact list
 *   POST /v1/contacts/lookup                   → Look up user by phone
 *   POST /v1/transfers/send                    → Send money P2P (201)
 *   POST /v1/transfers/request                 → Request money (201)
 *   GET  /v1/transfers/requests                → List money requests
 *   PUT  /v1/transfers/requests/{id}           → Accept/decline request
 *   GET  /v1/transactions                      → Transaction history
 *   GET  /v1/transactions/{id}                 → Transaction detail
 *   GET  /v1/transactions/export               → Export PDF/CSV
 */
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    // ========== Contacts ==========

    /**
     * GET /v1/contacts
     * Get user's saved contacts and favorites.
     * Front-end: SendMoney.tsx — contact list with "Frequent" section
     */
    @GetMapping("/contacts")
    public ResponseEntity<?> getContacts(@AuthenticationPrincipal UUID userId) {
        // TODO: return contactService.getContacts(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /v1/contacts/lookup
     * Look up user by phone number to verify before sending.
     * Front-end: SendMoney.tsx — phone input field validation
     */
    @PostMapping("/contacts/lookup")
    public ResponseEntity<?> lookupContact(@RequestBody ContactLookupRequest request) {
        // TODO: return contactService.lookup(request.getPhone());
        return ResponseEntity.ok().build();
    }

    // ========== Transfers ==========

    /**
     * POST /v1/transfers/send
     * Send money to another user (P2P transfer).
     *
     * Front-end: SendMoney.tsx — confirm button after PIN entry
     * Request: { recipientPhone, amount, note, pin }
     * Response: { transactionId, reference, amount, fee, totalDeducted, status, newBalance }
     */
    @PostMapping("/transfers/send")
    public ResponseEntity<SendMoneyResponse> sendMoney(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody SendMoneyRequest request) {
        SendMoneyResponse response = transferService.sendMoney(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /v1/transfers/request
     * Request money from another user.
     * Front-end: RequestMoney.tsx — request form
     */
    @PostMapping("/transfers/request")
    public ResponseEntity<?> requestMoney(
            @AuthenticationPrincipal UUID userId,
            @RequestBody MoneyRequestDTO request) {
        // TODO: return transferService.requestMoney(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /**
     * GET /v1/transfers/requests
     * List pending money requests (incoming/outgoing).
     */
    @GetMapping("/transfers/requests")
    public ResponseEntity<?> getRequests(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "incoming") String direction,
            @RequestParam(defaultValue = "PENDING") String status) {
        // TODO: return transferService.getRequests(userId, direction, status);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /v1/transfers/requests/{requestId}
     * Accept or decline a money request.
     */
    @PutMapping("/transfers/requests/{requestId}")
    public ResponseEntity<?> respondToRequest(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID requestId,
            @RequestBody RequestActionDTO action) {
        // TODO: return transferService.respondToRequest(userId, requestId, action);
        return ResponseEntity.ok().build();
    }

    // ========== Transaction History ==========

    /**
     * GET /v1/transactions
     * Paginated transaction history.
     * Front-end: TransactionHistory.tsx — list with filters
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // TODO: return transactionService.getHistory(userId, type, page, size);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /v1/transactions/{transactionId}
     * Single transaction detail.
     */
    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<?> getTransaction(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID transactionId) {
        // TODO: return transactionService.getDetail(userId, transactionId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /v1/transactions/export
     * Export transactions as PDF or CSV.
     */
    @GetMapping("/transactions/export")
    public ResponseEntity<?> exportTransactions(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "PDF") String format,
            @RequestParam String from,
            @RequestParam String to) {
        // TODO: return transactionService.export(userId, format, from, to);
        return ResponseEntity.ok().build();
    }
}

// --- Supporting DTOs (create as separate files) ---
// ContactLookupRequest: { String phone }
// MoneyRequestDTO: { String fromPhone, BigDecimal amount, String note }
// RequestActionDTO: { String action, String pin }  // action: ACCEPT | DECLINE
