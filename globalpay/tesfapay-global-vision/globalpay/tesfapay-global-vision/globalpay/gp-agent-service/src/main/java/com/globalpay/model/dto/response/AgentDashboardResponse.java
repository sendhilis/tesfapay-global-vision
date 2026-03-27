package com.globalpay.model.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class AgentDashboardResponse {
    private String     agentCode;
    private String     agentName;
    private BigDecimal floatBalance;
    private BigDecimal floatLimit;
    private int        floatPercentage;
    private DailyStats todayStats;
    private BigDecimal monthlyCommission;
    private List<RecentTransaction> recentTransactions;

    @Data @Builder
    public static class DailyStats {
        private int        transactionCount;
        private BigDecimal commission;
        private BigDecimal cashInVolume;
        private BigDecimal cashOutVolume;
    }

    @Data @Builder
    public static class RecentTransaction {
        private String     type;
        private String     customerName;
        private String     customerPhone;
        private BigDecimal amount;
        private BigDecimal commission;
        private String     time;
        private String     reference;
    }
}
