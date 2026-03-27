package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class OtpVerifyResponse {
    private boolean verified;
    private String accessToken;
    private String refreshToken;
    private String message;
}
