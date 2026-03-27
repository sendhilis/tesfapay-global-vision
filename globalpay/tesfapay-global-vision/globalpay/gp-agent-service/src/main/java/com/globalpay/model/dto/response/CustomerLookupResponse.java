package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class CustomerLookupResponse {
    private boolean found;
    private String  name;
    private String  phone;
    private String  walletId;
    private int     kycLevel;
}
