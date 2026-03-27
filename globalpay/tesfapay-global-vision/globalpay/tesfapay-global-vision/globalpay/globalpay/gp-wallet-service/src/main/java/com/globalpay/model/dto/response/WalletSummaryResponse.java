package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class WalletSummaryResponse {
    private BigDecimal todayIn;
    private BigDecimal todayOut;
    private BigDecimal weeklyIn;
    private BigDecimal weeklyOut;
    private int        pendingRequests;
}
