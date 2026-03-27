package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class RegisterResponse {
    private String userId;
    private String walletId;
    private String status;
    private boolean otpSent;
    private String message;
}
