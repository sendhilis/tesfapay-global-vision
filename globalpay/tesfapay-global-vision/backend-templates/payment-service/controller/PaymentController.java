package com.globalpay.payment.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Payment Controller — Bill payments, airtime, merchant payments.
 *
 * Maps to: API_CONTRACT.md §5 (Bills), §6 (Airtime), §7 (Merchants)
 * Front-end: PayBills.tsx, AirtimeTopup.tsx, MerchantPay.tsx
 *
 * Endpoints:
 *   GET  /v1/billers                     → List billers
 *   POST /v1/billers/{id}/validate       → Validate account
 *   POST /v1/billers/{id}/pay            → Pay bill (201)
 *   GET  /v1/airtime/operators           → List operators with bundles
 *   POST /v1/airtime/topup              → Purchase airtime/data (201)
 *   GET  /v1/merchants                   → Search merchants
 *   POST /v1/merchants/{id}/pay          → Pay merchant (201)
 *   POST /v1/merchants/scan              → Decode QR
 */
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class PaymentController {

    // private final BillerService billerService;
    // private final AirtimeService airtimeService;
    // private final MerchantService merchantService;

    // ========== Bill Payments ==========

    /** GET /v1/billers — Front-end: PayBills.tsx biller grid */
    @GetMapping("/billers")
    public ResponseEntity<?> listBillers(
            @RequestParam(required = false) String category) {
        // return billerService.listBillers(category);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/billers/{billerId}/validate — Validate biller account number */
    @PostMapping("/billers/{billerId}/validate")
    public ResponseEntity<?> validateBillerAccount(
            @PathVariable String billerId,
            @RequestBody Object request) {
        // return billerService.validateAccount(billerId, request);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/billers/{billerId}/pay — Pay a bill */
    @PostMapping("/billers/{billerId}/pay")
    public ResponseEntity<?> payBill(
            @AuthenticationPrincipal UUID userId,
            @PathVariable String billerId,
            @RequestBody Object request) {
        // return billerService.payBill(userId, billerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ========== Airtime ==========

    /** GET /v1/airtime/operators — Front-end: AirtimeTopup.tsx operator selection */
    @GetMapping("/airtime/operators")
    public ResponseEntity<?> listOperators() {
        // return airtimeService.listOperators();
        return ResponseEntity.ok().build();
    }

    /** POST /v1/airtime/topup — Purchase airtime or data bundle */
    @PostMapping("/airtime/topup")
    public ResponseEntity<?> purchaseAirtime(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // return airtimeService.purchase(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ========== Merchant Payments ==========

    /** GET /v1/merchants — Front-end: MerchantPay.tsx merchant search */
    @GetMapping("/merchants")
    public ResponseEntity<?> searchMerchants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        // return merchantService.search(search, category);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/merchants/{merchantId}/pay — Pay a merchant */
    @PostMapping("/merchants/{merchantId}/pay")
    public ResponseEntity<?> payMerchant(
            @AuthenticationPrincipal UUID userId,
            @PathVariable String merchantId,
            @RequestBody Object request) {
        // return merchantService.pay(userId, merchantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** POST /v1/merchants/scan — Decode QR code payload */
    @PostMapping("/merchants/scan")
    public ResponseEntity<?> scanQr(@RequestBody Object request) {
        // return merchantService.decodeQr(request);
        return ResponseEntity.ok().build();
    }
}
