package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class TransactionPageResponse {
    private List<TransactionResponse> transactions;
    private int        page;
    private int        totalPages;
    private long       totalTransactions;
    private BigDecimal netAmount;
    private BigDecimal periodIn;
    private BigDecimal periodOut;
}
