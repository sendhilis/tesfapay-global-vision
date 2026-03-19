package com.globalpay.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Login response DTO with JWT tokens + user profile summary.
 * Maps to: API_CONTRACT.md §1 — POST /auth/login response
 */
@Data
@Builder
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private UserSummary user;

    @Data
    @Builder
    @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String name;
        private String walletId;
        private int kycLevel;
    }
}
