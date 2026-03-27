package com.globalpay.model.dto.response;
import lombok.*;
@Data @Builder public class NearbyAgentResponse { private String name; private String code; private String distance; private boolean isOpen; }
