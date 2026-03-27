package com.globalpay.service;
import com.globalpay.client.*;
import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
@Slf4j @Service @RequiredArgsConstructor
public class AdminService {
    private final AuditLogRepository auditRepo;
    private final FraudAlertRepository fraudRepo;
    private final SystemConfigRepository configRepo;
    private final WalletAdminClient walletAdminClient;
    private final UserAdminClient userAdminClient;
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard() {
        return Map.of("status","OK","totalUsers",67750);
    }
    @Transactional(readOnly = true)
    public List<SystemConfig> getSystemConfig() { return configRepo.findAll(); }
    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLog(int page, int size) {
        return auditRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(page,size));
    }
    public Map<String,Object> getEMoneySummary() { return Map.of("status","MATCHED"); }
    public Map<String,Object> getAnalytics(String p) { return Map.of("period",p); }
    public Page<FraudAlert> getFraudAlerts(String s,int p,int sz) {
        return fraudRepo.findByStatusOrderByCreatedAtDesc(s!=null?s:"OPEN",PageRequest.of(p,sz));
    }
    @Transactional
    public SystemConfig updateConfig(String key,String value) {
        SystemConfig c=configRepo.findById(key).orElseThrow(()->new RuntimeException("Not found: "+key));
        c.setValue(value);return configRepo.save(c);
    }
}
