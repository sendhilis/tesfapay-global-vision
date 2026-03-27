package com.globalpay.controller;
import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.service.AgentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor
public class AgentController {
    private final AgentService svc;
    @GetMapping("/agent/dashboard") public ResponseEntity<?> d(HttpServletRequest r){return ResponseEntity.ok(svc.getDashboard(id(r)));}
    @PostMapping("/agent/cashin") public ResponseEntity<?> ci(HttpServletRequest r,@RequestBody CashInRequest b){return ResponseEntity.status(201).body(svc.cashIn(id(r),2));}
    @PostMapping("/agent/cashout") public ResponseEntity<?> co(HttpServletRequest r,@RequestBody CashOutRequest b){return ResponseEntity.status(201).body(svc.cashOut(id(r),b));}
    @GetMapping("/agents/nearby") public ResponseEntity<?> nearby(@RequestParam double lat,@RequestParam double lng){return ResponseEntity.ok(Map.of("agents",svc.getNearbyAgents(lat,lng,5)));}
    private java.util.UUID id(HttpServletRequest r) { return java.util.UUID.fromString(r.getAttribute("userId").toString()); }
}
