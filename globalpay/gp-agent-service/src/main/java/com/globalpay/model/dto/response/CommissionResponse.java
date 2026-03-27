package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class CommissionResponse {
    private BigDecimal totalCommission;
    private long       transactionCount;
    private BigDecimal averagePerTransaction;
    private List<BreakdownItem> breakdown;
    private List<DailyTrendItem> dailyTrend;

    @Data @Builder public static class BreakdownItem {
        private String type;
        private long count;
        private BigDecimal volume;
        private BigDecimal commission;
    }
    @Data @Builder public static class DailyTrendItem {
        private String     date;
        private BigDecimal commission;
        private long       count;
    }
}
