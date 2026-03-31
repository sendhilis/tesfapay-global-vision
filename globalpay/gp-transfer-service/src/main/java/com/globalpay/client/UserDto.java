package com.globalpay.client;
import lombok.Data;
@Data
public class UserDto {
    private String id;
    private String firstName;
    private String lastName;
    private String phone;
    private String walletId;
    private int kycLevel;
    private String status;
    public String getFullName() { return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : ""); }
}