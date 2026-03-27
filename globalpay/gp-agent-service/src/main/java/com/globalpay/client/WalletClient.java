package com.globalpay.client;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;
@FeignClient(name = "gp-wallet-service", path = "/internal/wallets")
public interface WalletClient {
    @PostMapping("/credit") ResponseEntity<WalletOpResponse> credit(@RequestBody WalletOpRequest req);
    @PostMapping("/debit")  ResponseEntity<WalletOpResponse> debit(@RequestBody WalletOpRequest req);
}
@Data class WalletOpRequest {
    private UUID userId; private BigDecimal amount; private String type;
    private String reference; private String counterpartyName; private String note; private String idempotencyKey;
}
@Data class WalletOpResponse {
    private UUID transactionId; private String reference; private String status;
    private BigDecimal amount; private BigDecimal newBalance;
}
