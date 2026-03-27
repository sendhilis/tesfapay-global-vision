package com.globalpay.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "gp-user-service")
public interface UserClient {

    @GetMapping("/internal/users/phone/{phone}")
    ResponseEntity<UserDto> findByPhone(@PathVariable("phone") String phone);

    @GetMapping("/internal/users/{userId}")
    ResponseEntity<UserDto> findById(@PathVariable("userId") String userId);
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
    private double dailyLimit;
    private double monthlyLimit;

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
