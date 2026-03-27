package com.globalpay.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransactionResponse {
    private UUID        id;
    private String      reference;
    private String      type;
    private String      counterparty;
    private String      counterpartyPhone;
    private BigDecimal  amount;
    private BigDecimal  fee;
    private BigDecimal  totalAmount;
    private String      note;
    private String      status;
    private int         loyaltyPointsEarned;
    private BigDecimal  balanceAfter;
    private Instant     date;
}
