package com.globalpay.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Map;
@FeignClient(name = "gp-wallet-service") public interface WalletAdminClient {
    @GetMapping("/internal/stats") Map<String, Object> getStats();
}
@FeignClient(name = "gp-user-service") public interface UserAdminClient {
    @GetMapping("/internal/stats") Map<String, Object> getStats();
}
