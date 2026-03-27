package com.globalpay.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Map;

@FeignClient(name = "gp-wallet-service")
public interface WalletAdminClient {
    @GetMapping("/internal/stats")
    Map<String, Object> getStats();
}

@FeignClient(name = "gp-user-service")
interface UserAdminClientInternal {
    @GetMapping("/internal/stats")
    Map<String, Object> getStats();
}

// Public-facing alias used by AdminService
interface UserAdminClient {
    Map<String, Object> getStats();
}
