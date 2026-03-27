package com.globalpay.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;

// ── Wallet Client ────────────────────────────────────────────────

@FeignClient(name = "gp-wallet-service", path = "/internal/wallets")
public interface WalletClient {

    @PostMapping("/credit")
    ResponseEntity<WalletOpResponse> credit(@RequestBody WalletOpRequest req);

    @PostMapping("/debit")
    ResponseEntity<WalletOpResponse> debit(@RequestBody WalletOpRequest req);
}

@Data
class WalletOpRequest {
    private UUID userId;
    private BigDecimal amount;
    private String type;
    private String reference;
    private String counterpartyName;
    private String note;
    private String idempotencyKey;

    public static WalletOpRequest build(UUID userId, BigDecimal amount, String type,
                                         String ref, String counterparty, String note) {
        WalletOpRequest r = new WalletOpRequest();
        r.userId = userId; r.amount = amount; r.type = type;
        r.reference = ref; r.counterpartyName = counterparty; r.note = note;
        return r;
    }
}

@Data
class WalletOpResponse {
    private UUID transactionId;
    private String reference;
    private String status;
    private BigDecimal amount;
    private BigDecimal newBalance;
}

// ── User Client ──────────────────────────────────────────────────

@FeignClient(name = "gp-user-service")
public interface UserClient {

    @GetMapping("/internal/users/phone/{phone}")
    ResponseEntity<UserDto> findByPhone(@PathVariable("phone") String phone);
}

@Data
class UserDto {
    private String id;
    private String firstName;
    private String lastName;
    private String phone;
    private String walletId;
    private int kycLevel;
    private String status;

    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }
}
