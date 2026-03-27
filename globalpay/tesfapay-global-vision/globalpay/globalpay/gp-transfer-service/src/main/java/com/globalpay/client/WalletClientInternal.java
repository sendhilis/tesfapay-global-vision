package com.globalpay.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;

// ── Wallet Service Client ────────────────────────────────────────

@FeignClient(name = "gp-wallet-service", path = "/internal/wallets")
interface WalletClientInternal {

    @PostMapping("/debit")
    ResponseEntity<WalletOpResponse> debit(@RequestBody WalletOpRequest req);

    @PostMapping("/credit")
    ResponseEntity<WalletOpResponse> credit(@RequestBody WalletOpRequest req);
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

    public static WalletOpRequest of(UUID userId, BigDecimal amount, String type,
                                      String ref, String counterparty, String note, String idem) {
        WalletOpRequest r = new WalletOpRequest();
        r.userId = userId; r.amount = amount; r.type = type;
        r.reference = ref; r.counterpartyName = counterparty;
        r.note = note; r.idempotencyKey = idem;
        return r;
    }
}

@Data
class WalletOpResponse {
    private UUID transactionId;
    private String reference;
    private String status;
    private BigDecimal amount;
    private BigDecimal fee;
    private BigDecimal newBalance;
    private int loyaltyPointsEarned;
}
