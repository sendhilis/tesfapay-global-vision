package com.globalpay.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Registration response DTO.
 * Maps to: API_CONTRACT.md §1 — POST /auth/register response
 */
@Data
@Builder
@AllArgsConstructor
public class RegisterResponse {
    private String userId;
    private String walletId;
    private String status;    // PENDING_KYC
    private boolean otpSent;
}
