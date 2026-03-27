package com.globalpay.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;

@FeignClient(name = "gp-wallet-service", path = "/internal/wallets")
public interface WalletClient {
    @PostMapping("/credit") ResponseEntity<WalletOpResponse> creditWallet(@RequestBody WalletOpRequest req);
    @PostMapping("/debit")  ResponseEntity<WalletOpResponse> debitWallet(@RequestBody WalletOpRequest req);
    default WalletOpResponse credit(UUID uid, BigDecimal amt, String t, String r, String cp, String n) {
        WalletOpRequest req = new WalletOpRequest(); req.setUserId(uid); req.setAmount(amt);
        req.setType(t); req.setReference(r); req.setCounterpartyName(cp); req.setNote(n);
        var resp = creditWallet(req); return resp != null ? resp.getBody() : null;
    }
    default WalletOpResponse debit(UUID uid, BigDecimal amt, String t, String r, String cp, String n) {
        WalletOpRequest req = new WalletOpRequest(); req.setUserId(uid); req.setAmount(amt);
        req.setType(t); req.setReference(r); req.setCounterpartyName(cp); req.setNote(n);
        var resp = debitWallet(req); return resp != null ? resp.getBody() : null;
    }
}

@Data class WalletOpRequest { private UUID userId; private BigDecimal amount; private String type;
    private String reference; private String counterpartyName; private String note; }
@Data class WalletOpResponse { private UUID transactionId; private String status; private BigDecimal newBalance; }
