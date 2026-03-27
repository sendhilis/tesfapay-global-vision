package com.globalpay.controller;

import com.globalpay.model.entity.*;
import com.globalpay.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController @RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ── Billers ──────────────────────────────────────────────────

    @Tag(name = "Bill Payments")
    @Operation(summary = "List billers by category")
    @GetMapping("/billers")
    public ResponseEntity<?> getBillers(@RequestParam(required = false) String category) {
        return ResponseEntity.ok(Map.of("billers", paymentService.getBillers(category)));
    }

    @Tag(name = "Bill Payments")
    @Operation(summary = "Validate biller account number")
    @PostMapping("/billers/{billerId}/validate")
    public ResponseEntity<?> validate(@PathVariable UUID billerId,
                                       @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(paymentService.validateBiller(billerId, body.get("accountNumber")));
    }

    @Tag(name = "Bill Payments")
    @Operation(summary = "Pay a bill")
    @PostMapping("/billers/{billerId}/pay")
    public ResponseEntity<?> payBill(@PathVariable UUID billerId,
                                      @RequestBody Map<String, Object> body,
                                      HttpServletRequest req) {
        UUID userId = userId(req);
        String walletId = (String) req.getAttribute("walletId");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String accountNumber = (String) body.get("accountNumber");
        String idem = (String) body.get("idempotencyKey");
        return ResponseEntity.status(201).body(
                paymentService.payBill(userId, walletId, billerId, accountNumber, amount, idem));
    }

    // ── Airtime ──────────────────────────────────────────────────

    @Tag(name = "Airtime")
    @Operation(summary = "List telecom operators with bundles")
    @GetMapping("/airtime/operators")
    public ResponseEntity<?> getOperators() {
        return ResponseEntity.ok(Map.of("operators", paymentService.getOperators()));
    }

    @Tag(name = "Airtime")
    @Operation(summary = "Purchase airtime or data bundle")
    @PostMapping("/airtime/topup")
    public ResponseEntity<?> topup(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        UUID userId = userId(req);
        String walletId = (String) req.getAttribute("walletId");
        return ResponseEntity.status(201).body(
                paymentService.topupAirtime(userId, walletId,
                        UUID.fromString(body.get("operatorId").toString()),
                        UUID.fromString(body.get("bundleId").toString()),
                        (String) body.get("recipientPhone"),
                        (String) body.get("idempotencyKey")));
    }

    // ── Merchants ─────────────────────────────────────────────────

    @Tag(name = "Merchant Payments")
    @Operation(summary = "Search merchants")
    @GetMapping("/merchants")
    public ResponseEntity<?> getMerchants(@RequestParam(required = false) String search,
                                           @RequestParam(required = false) String category) {
        return ResponseEntity.ok(Map.of("merchants", paymentService.getMerchants(search, category)));
    }

    @Tag(name = "Merchant Payments")
    @Operation(summary = "Decode QR code to resolve merchant")
    @PostMapping("/merchants/scan")
    public ResponseEntity<?> scanQr(@RequestBody Map<String, String> body) {
        return paymentService.scanQr(body.get("qrPayload"))
                .map(m -> ResponseEntity.ok((Object) Map.of(
                        "merchantId", m.getMerchantId(), "name", m.getName(), "category", m.getCategory())))
                .orElse(ResponseEntity.notFound().build());
    }

    @Tag(name = "Merchant Payments")
    @Operation(summary = "Pay a merchant via QR or direct")
    @PostMapping("/merchants/{merchantId}/pay")
    public ResponseEntity<?> payMerchant(@PathVariable String merchantId,
                                          @RequestBody Map<String, Object> body,
                                          HttpServletRequest req) {
        UUID userId = userId(req);
        String walletId = (String) req.getAttribute("walletId");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        return ResponseEntity.status(201).body(
                paymentService.payMerchant(userId, walletId, merchantId, amount,
                        (String) body.get("idempotencyKey")));
    }

    private UUID userId(HttpServletRequest req) {
        return UUID.fromString(req.getAttribute("userId").toString());
    }
}
