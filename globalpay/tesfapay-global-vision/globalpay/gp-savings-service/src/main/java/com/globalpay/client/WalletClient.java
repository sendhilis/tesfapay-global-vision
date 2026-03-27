package com.globalpay.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;

@FeignClient(name = "gp-wallet-service", path = "/internal/wallets")
public interface WalletClient {
    @PostMapping("/debit")  ResponseEntity<WalletOpResponse> debitWallet(@RequestBody WalletOpRequest req);
    @PostMapping("/credit") ResponseEntity<WalletOpResponse> creditWallet(@RequestBody WalletOpRequest req);

    default WalletOpResponse debit(UUID userId, BigDecimal amount, String type, String ref, String cp, String note) {
        WalletOpRequest r = new WalletOpRequest(); r.setUserId(userId); r.setAmount(amount);
        r.setType(type); r.setReference(ref); r.setCounterpartyName(cp); r.setNote(note);
        var resp = debitWallet(r); return resp != null ? resp.getBody() : null;
    }
    default WalletOpResponse credit(UUID userId, BigDecimal amount, String type, String ref, String cp, String note) {
        WalletOpRequest r = new WalletOpRequest(); r.setUserId(userId); r.setAmount(amount);
        r.setType(type); r.setReference(ref); r.setCounterpartyName(cp); r.setNote(note);
        var resp = creditWallet(r); return resp != null ? resp.getBody() : null;
    }
}

@Data class WalletOpRequest {
    private UUID userId; private BigDecimal amount; private String type;
    private String reference; private String counterpartyName; private String note; private String idempotencyKey;
}
@Data class WalletOpResponse { private UUID transactionId; private String status; private BigDecimal newBalance; }
