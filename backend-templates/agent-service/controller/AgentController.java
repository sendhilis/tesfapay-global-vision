package com.globalpay.agent.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Agent Controller — agent portal operations + cash in/out.
 *
 * Maps to: API_CONTRACT.md §8 (Cash In/Out), §14 (Agent Portal)
 * Front-end: AgentHome.tsx, AgentCashIn.tsx, AgentCashOut.tsx,
 *            AgentCustomers.tsx, AgentCommission.tsx, AgentFloat.tsx,
 *            CashInOut.tsx (user-side)
 *
 * Security: All endpoints require ROLE_AGENT (except /cash/* and /agents/nearby)
 *
 * Endpoints:
 *   GET  /v1/agents/nearby                   → Find nearby agents (user-side)
 *   POST /v1/cash/in                         → Initiate cash-in (user-side, 201)
 *   POST /v1/cash/out                        → Initiate cash-out (user-side, 201)
 *   GET  /v1/agent/dashboard                 → Agent dashboard stats
 *   POST /v1/agent/customers/lookup          → Look up customer
 *   POST /v1/agent/cashin                    → Process cash-in (agent-side, 201)
 *   POST /v1/agent/cashout                   → Process cash-out (agent-side, 201)
 *   GET  /v1/agent/commission                → Commission report
 *   GET  /v1/agent/float                     → Float management
 *   POST /v1/agent/float/request             → Request float top-up (201)
 *   GET  /v1/agent/customers                 → Customer list
 *   POST /v1/agent/customers/register        → Register new customer (201)
 */
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class AgentController {

    // private final AgentService agentService;
    // private final CashService cashService;

    // ========== User-facing Cash Endpoints ==========

    /** GET /v1/agents/nearby — Front-end: CashInOut.tsx agent map */
    @GetMapping("/agents/nearby")
    public ResponseEntity<?> findNearbyAgents(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radius) {
        // return agentService.findNearby(lat, lng, radius);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/cash/in — User initiates cash-in, receives OTP for agent */
    @PostMapping("/cash/in")
    public ResponseEntity<?> initiateCashIn(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // return cashService.initiateCashIn(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** POST /v1/cash/out — User initiates cash-out */
    @PostMapping("/cash/out")
    public ResponseEntity<?> initiateCashOut(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // return cashService.initiateCashOut(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // ========== Agent Portal Endpoints (ROLE_AGENT required) ==========

    /** GET /v1/agent/dashboard — Front-end: AgentHome.tsx */
    @GetMapping("/agent/dashboard")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal UUID userId) {
        // return agentService.getDashboard(userId);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/agent/customers/lookup — Front-end: AgentCashIn.tsx */
    @PostMapping("/agent/customers/lookup")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> lookupCustomer(@RequestBody Object request) {
        // return agentService.lookupCustomer(request);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/agent/cashin — Process customer cash-in with OTP */
    @PostMapping("/agent/cashin")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> processCashIn(
            @AuthenticationPrincipal UUID agentUserId,
            @RequestBody Object request) {
        // Validates OTP, credits customer wallet, debits agent float
        // return agentService.processCashIn(agentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** POST /v1/agent/cashout — Process customer cash-out with OTP */
    @PostMapping("/agent/cashout")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> processCashOut(
            @AuthenticationPrincipal UUID agentUserId,
            @RequestBody Object request) {
        // Validates OTP, debits customer wallet, credits agent float
        // return agentService.processCashOut(agentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** GET /v1/agent/commission — Front-end: AgentCommission.tsx */
    @GetMapping("/agent/commission")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> getCommission(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(defaultValue = "MONTH") String period) {
        // return agentService.getCommissionReport(userId, period);
        return ResponseEntity.ok().build();
    }

    /** GET /v1/agent/float — Front-end: AgentFloat.tsx */
    @GetMapping("/agent/float")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> getFloat(@AuthenticationPrincipal UUID userId) {
        // return agentService.getFloatDetails(userId);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/agent/float/request — Request float top-up */
    @PostMapping("/agent/float/request")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> requestFloat(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Object request) {
        // return agentService.requestFloatTopup(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** GET /v1/agent/customers — Front-end: AgentCustomers.tsx */
    @GetMapping("/agent/customers")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> getCustomers(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page) {
        // return agentService.getCustomers(userId, search, page);
        return ResponseEntity.ok().build();
    }

    /** POST /v1/agent/customers/register — Agent-assisted customer onboarding */
    @PostMapping("/agent/customers/register")
    @PreAuthorize("hasRole('AGENT')")
    public ResponseEntity<?> registerCustomer(
            @AuthenticationPrincipal UUID agentUserId,
            @RequestBody Object request) {
        // return agentService.registerCustomer(agentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
