package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;           // seconds
    private UserSummary user;

    @Data @Builder
    public static class UserSummary {
        private String id;
        private String name;
        private String phone;
        private String walletId;
        private int kycLevel;
        private String role;
        private String status;
    }
}
