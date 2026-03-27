package com.globalpay.controller;
import com.globalpay.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;
@RestController @RequiredArgsConstructor PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;
    @GetMapping("/admin/dashboard") public ResponseEntity<?> d(){return ResponseEntity.ok(adminService.getDashboard());}
    @GetMapping("/admin/analytics") public ResponseEntity<?> a(@RequestParam(defaultValue="30d") String period){return ResponseEntity.ok(adminService.getAnalytics(period));}
    @GetMapping("/admin/fraud-alerts") public ResponseEntity<?> f(@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return ResponseEntity.ok(adminService.getFraudAlerts(status,page,size));}
    @PutMapping("/admin/config/{key}") public ResponseEntity<?> uc(@PathVariable String key,@RequestBody Map<String,String> body){return ResponseEntity.ok(adminService.updateConfig(key,body.get("value")));}
    @GetMapping("/admin/audit-log") public ResponseEntity<?> al(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="50") int size){return ResponseEntity.ok(adminService.getAuditLog(page,size));}
}
