package com.globalpay.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data @Builder
public class NearbyAgentResponse {
    private UUID       id;
    private String     name;
    private String     code;
    private String     distance;
    private String     address;
    private BigDecimal rating;
    private boolean    isOpen;
}
