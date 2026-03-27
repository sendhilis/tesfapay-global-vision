package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder
public class ContactResponse {
    private UUID    id;
    private String  name;
    private String  phone;
    private String  avatarInitials;
    private boolean isFavorite;
    private boolean isGlobalPayUser;
}
