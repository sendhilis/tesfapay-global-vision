package com.globalpay.client;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.UUID;
@FeignClient(name="gp-wallet-service",path="/internal/wallets") public interface WalletClient {
    @PostMapping("/credit") ResponseEntity<WalletOpResponse> credit(@RequestBody WalletOpRequest req);
    @PostMapping("/debit") ResponseEntity<WalletOpResponse> debit(@RequestBody WalletOpRequest req);
}
@Data class WalletOpRequest { private UUID userId; private BigDecimal amount; private String type; private String reference;
    public static WalletOpRequest build(UUID u,BigDecimal a,String t,String r,String cp,Null n){WalletOpRequest q=new WalletOpRequest();q.userId=u;q.amount=a;q.type=t;q.reference=r;return q;}
}
@Data class WalletOpResponse { private UUID transactionId; private String reference; private String status; private BigDecimal newBalance; }
@FeignClient(name="gp-user-service") public interface UserClient {
    @GetMapping("/internal/users/phone/{phone}") ResponseEntity<UserDto> findByPhone(@PathVariable("phone") String phone);
}
@Data class UserDto { private String id; private String firstName; private String lastName; private String phone; private String walletId; private int kycLevel; public String getFullName(){return firstName+" "+lastName;} }
