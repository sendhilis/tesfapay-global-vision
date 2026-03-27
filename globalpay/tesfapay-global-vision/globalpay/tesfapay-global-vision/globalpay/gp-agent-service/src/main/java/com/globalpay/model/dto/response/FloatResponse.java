package com.globalpay.model.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class FloatResponse {
    private BigDecimal balance;
    private BigDecimal limit;
    private int        percentage;
    private String     superAgentName;
    private LastTopup  lastTopup;
    private List<FloatHistoryItem> history;

    @Data @Builder public static class LastTopup {
        private BigDecimal amount;
        private Instant    date;
    }
    @Data @Builder public static class FloatHistoryItem {
        private String     type;
        private BigDecimal amount;
        private String     source;
        private Instant    date;
    }
}
