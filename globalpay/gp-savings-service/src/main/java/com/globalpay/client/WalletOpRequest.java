package com.globalpay.client;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;
@Data
public class WalletOpRequest {
    private UUID userId;
    private BigDecimal amount;
    private String type;
    private String reference;
    private String counterpartyName;
    private String note;
    private String idempotencyKey;
}