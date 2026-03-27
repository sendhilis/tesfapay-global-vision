package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class ContactLookupResponse {
    private boolean found;
    private String  name;
    private String  avatarInitials;
    private String  walletId;
}
