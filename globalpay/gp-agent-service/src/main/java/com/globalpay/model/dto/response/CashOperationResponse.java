package com.globalpay.model.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;
@Data @Builder public class CashOperationResponse { private UUID transactionId; private String reference; private BigDecimal amount; private String status; }
