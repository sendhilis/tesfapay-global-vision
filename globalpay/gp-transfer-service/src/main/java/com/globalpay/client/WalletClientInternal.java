package com.globalpay.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@FeignClient(name = "gp-wallet-service", path = "/internal/wallets")
public interface WalletClientInternal {
    @PostMapping("/debit") ResponseEntity<WalletOpResponse> debit(@RequestBody WalletOpRequest req);
    @PostMapping("/credit") ResponseEntity<WalletOpResponse> credit(@RequestBody WalletOpRequest req);
}