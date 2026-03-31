package com.globalpay.client;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;
@Data
public class WalletOpResponse {
    private UUID transactionId;
    private String reference;
    private String status;
    private BigDecimal newBalance;
}