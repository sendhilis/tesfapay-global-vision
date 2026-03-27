package com.globalpay.model.dto.response;
import lombok.*;
import java.math.BigDecimal;
@Data @Builder public class AgentDashboardResponse { private String agentName; private BigDecimal floatBalance; private BigDecimal monthlyCommission; }
