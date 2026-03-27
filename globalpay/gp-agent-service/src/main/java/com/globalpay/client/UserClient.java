package com.globalpay.client;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@FeignClient(name = "gp-user-service")
public interface UserClient {
    @GetMapping("/internal/users/phone/{phone}")
    ResponseEntity<UserDto> findByPhone(@PathVariable("phone") String phone);
}
@Data class UserDto {
    private String id, firstName, lastName, phone, walletId, status;
    private int kycLevel;
    public String getFullName() { return (firstName!=null?firstName:"")+" "+(lastName!=null?lastName:""); }
}
