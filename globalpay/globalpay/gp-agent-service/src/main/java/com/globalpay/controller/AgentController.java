package com.globalpay.controller;

import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.service.AgentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AgentController {

    private final AgentService agentService;

    // ── GET /agent/dashboard ─────────────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Agent dashboard stats")
    @GetMapping("/agent/dashboard")
    public ResponseEntity<AgentDashboardResponse> getDashboard(HttpServletRequest req) {
        return ResponseEntity.ok(agentService.getDashboard(userId(req)));
    }

    // ── POST /agent/customers/lookup ─────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Look up customer by phone or wallet ID")
    @PostMapping("/agent/customers/lookup")
    public ResponseEntity<CustomerLookupResponse> lookupCustomer(
            @Valid @RequestBody CustomerLookupRequest body) {
        return ResponseEntity.ok(agentService.lookupCustomer(body.getQuery()));
    }

    // ── POST /agent/cashin ───────────────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Process cash-in for customer (agent confirms with OTP)")
    @PostMapping("/agent/cashin")
    public ResponseEntity<CashOperationResponse> cashIn(
            HttpServletRequest req,
            @Valid @RequestBody CashInRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(agentService.cashIn(userId(req), body));
    }

    // ── POST /agent/cashout ──────────────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Process cash-out for customer (agent confirms with OTP)")
    @PostMapping("/agent/cashout")
    public ResponseEntity<CashOperationResponse> cashOut(
            HttpServletRequest req,
            @Valid @RequestBody CashOutRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(agentService.cashOut(userId(req), body));
    }

    // ── GET /agent/float ─────────────────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Float balance and history")
    @GetMapping("/agent/float")
    public ResponseEntity<FloatResponse> getFloat(HttpServletRequest req) {
        return ResponseEntity.ok(agentService.getFloat(userId(req)));
    }

    // ── POST /agent/float/request ────────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Request float top-up from super agent")
    @PostMapping("/agent/float/request")
    public ResponseEntity<Map<String, Object>> requestFloat(
            HttpServletRequest req,
            @Valid @RequestBody FloatTopupRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(agentService.requestFloatTopup(userId(req), body));
    }

    // ── GET /agent/commission ────────────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Commission report", description = "period: TODAY | WEEK | MONTH (default MONTH)")
    @GetMapping("/agent/commission")
    public ResponseEntity<CommissionResponse> getCommission(
            HttpServletRequest req,
            @RequestParam(defaultValue = "MONTH") String period) {
        return ResponseEntity.ok(agentService.getCommission(userId(req), period));
    }

    // ── GET /agent/customers ─────────────────────────────────────

    @Tag(name = "Agent Portal")
    @Operation(summary = "Customers served by this agent")
    @GetMapping("/agent/customers")
    public ResponseEntity<?> getCustomers(
            HttpServletRequest req,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(agentService.getCustomers(userId(req), page, size));
    }

    // ── GET /agents/nearby ───────────────────────────────────────

    @Tag(name = "Agents (Public)")
    @Operation(summary = "Find nearby agents", description = "Used by customer CashInOut.tsx screen")
    @GetMapping("/agents/nearby")
    public ResponseEntity<Map<String, List<NearbyAgentResponse>>> getNearbyAgents(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radius) {
        return ResponseEntity.ok(Map.of("agents", agentService.getNearbyAgents(lat, lng, radius)));
    }

    // ── Util ─────────────────────────────────────────────────────

    private UUID userId(HttpServletRequest req) {
        Object attr = req.getAttribute("userId");
        if (attr == null) throw new org.springframework.security.access.AccessDeniedException("No auth context");
        return UUID.fromString(attr.toString());
    }
}
