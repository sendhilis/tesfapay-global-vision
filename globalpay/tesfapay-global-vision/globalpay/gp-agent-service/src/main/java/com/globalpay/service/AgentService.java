package com.globalpay.service;

import com.globalpay.client.*;
import com.globalpay.exception.*;
import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentRepository            agentRepository;
    private final AgentTransactionRepository agentTxnRepository;
    private final AgentCommissionRepository  commissionRepository;
    private final AgentFloatHistoryRepository floatHistoryRepository;
    private final AgentFloatRequestRepository floatRequestRepository;
    private final AgentCustomerRepository    customerRepository;
    private final WalletClient               walletClient;
    private final UserClient                 userClient;
    private final KafkaTemplate<String, Object> kafka;

    // BCrypt for OTP hashing (same cost as auth-service passwords)
    private final PasswordEncoder otpEncoder = new BCryptPasswordEncoder(10);

    @Value("${agent.commission.rate:0.003}")
    private BigDecimal commissionRate;

    @Value("${agent.commission.min-etb:2.00}")
    private BigDecimal minCommission;

    @Value("${agent.cash-in.fee:5.00}")
    private BigDecimal cashInFee;

    @Value("${agent.cash-out.fee:5.00}")
    private BigDecimal cashOutFee;

    // ── Dashboard ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AgentDashboardResponse getDashboard(UUID agentUserId) {
        Agent agent = getAgentByUserIdOrThrow(agentUserId);

        Instant startOfDay  = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant startOfWeek = Instant.now().minus(7, ChronoUnit.DAYS);

        BigDecimal todayCommission = commissionRepository.sumSince(agent.getId(), startOfDay);
        long       todayCount      = commissionRepository.countSince(agent.getId(), startOfDay);

        // Recent 5 transactions
        List<AgentTransaction> recent = agentTxnRepository
                .findByAgentIdOrderByCreatedAtDesc(agent.getId(), PageRequest.of(0, 5))
                .getContent();

        List<AgentDashboardResponse.RecentTransaction> recentDtos = recent.stream()
                .map(t -> {
                    BigDecimal comm = calculateCommission(t.getAmount());
                    return AgentDashboardResponse.RecentTransaction.builder()
                            .type(t.getType())
                            .customerName(t.getCustomerName())
                            .customerPhone(t.getCustomerPhone())
                            .amount(t.getAmount())
                            .commission(comm)
                            .time(formatTime(t.getCreatedAt()))
                            .reference(t.getReference())
                            .build();
                }).collect(Collectors.toList());

        int floatPct = agent.getFloatLimit().compareTo(BigDecimal.ZERO) > 0
                ? agent.getFloatBalance().multiply(BigDecimal.valueOf(100))
                       .divide(agent.getFloatLimit(), 0, RoundingMode.HALF_UP).intValue()
                : 0;

        return AgentDashboardResponse.builder()
                .agentCode(agent.getCode())
                .agentName(agent.getBusinessName() != null ? agent.getBusinessName() : "Agent " + agent.getCode())
                .floatBalance(agent.getFloatBalance())
                .floatLimit(agent.getFloatLimit())
                .floatPercentage(floatPct)
                .todayStats(AgentDashboardResponse.DailyStats.builder()
                        .transactionCount((int) todayCount)
                        .commission(todayCommission)
                        .cashInVolume(BigDecimal.ZERO)  // extend with type-filtered query
                        .cashOutVolume(BigDecimal.ZERO)
                        .build())
                .monthlyCommission(agent.getMonthlyCommission())
                .recentTransactions(recentDtos)
                .build();
    }

    // ── Customer Lookup (for agent dashboard) ────────────────────

    @Transactional(readOnly = true)
    public CustomerLookupResponse lookupCustomer(String query) {
        try {
            var resp = userClient.findByPhone(query);
            if (resp != null && resp.hasBody() && resp.getBody() != null) {
                UserDto u = resp.getBody();
                return CustomerLookupResponse.builder()
                        .found(true)
                        .name(u.getFullName().trim())
                        .phone(u.getPhone())
                        .walletId(u.getWalletId())
                        .kycLevel(u.getKycLevel())
                        .build();
            }
        } catch (Exception ignored) {}
        return CustomerLookupResponse.builder().found(false).build();
    }

    // ── Cash-In (agent confirms customer deposit) ────────────────

    @Transactional
    public CashOperationResponse cashIn(UUID agentUserId, CashInRequest req) {
        Agent agent = getAgentByUserIdOrThrow(agentUserId);
        validateAgentActive(agent);

        // Lookup customer
        UserDto customer = lookupUserOrThrow(req.getCustomerPhone());

        // Find pending cash-in transaction for this customer
        AgentTransaction pending = findPendingCashTransaction(
                UUID.fromString(customer.getId()), "CASH_IN");

        // Verify OTP
        if (!otpEncoder.matches(req.getOtp(), pending.getOtpCodeHash())) {
            throw new InvalidOtpException("Invalid or expired OTP");
        }
        if (pending.getCreatedAt().plus(15, ChronoUnit.MINUTES).isBefore(Instant.now())) {
            pending.setStatus("EXPIRED");
            agentTxnRepository.save(pending);
            throw new InvalidOtpException("Cash-in OTP has expired");
        }

        BigDecimal netAmount   = pending.getAmount().subtract(cashInFee);
        BigDecimal commission  = calculateCommission(pending.getAmount());

        // Credit customer wallet
        WalletOpResponse walletResp;
        try {
            walletResp = walletClient.credit(WalletOpRequest.build(
                    UUID.fromString(customer.getId()), netAmount, "CASH_IN",
                    pending.getReference(), "Cash-in via Agent " + agent.getCode(), null
            )).getBody();
        } catch (Exception e) {
            log.error("Wallet credit failed for cash-in {}: {}", pending.getReference(), e.getMessage());
            throw new RuntimeException("Cash-in failed: wallet credit error");
        }

        // Debit agent float
        int updated = agentRepository.debitFloat(agent.getId(), pending.getAmount());
        if (updated == 0) throw new InsufficientFloatException("Insufficient float balance");

        // Complete transaction
        pending.setStatus("COMPLETED");
        pending.setCompletedAt(Instant.now());
        if (walletResp != null) pending.setWalletTxnId(walletResp.getTransactionId());
        agentTxnRepository.save(pending);

        // Record commission
        AgentCommission comm = AgentCommission.builder()
                .agentId(agent.getId())
                .transactionRef(pending.getReference())
                .type("CASH_IN")
                .transactionAmount(pending.getAmount())
                .commissionAmount(commission)
                .build();
        commissionRepository.save(comm);

        // Update float history
        BigDecimal newFloat = agent.getFloatBalance().subtract(pending.getAmount());
        floatHistoryRepository.save(AgentFloatHistory.builder()
                .agentId(agent.getId()).type("DEBIT").amount(pending.getAmount())
                .balanceAfter(newFloat).source("Cash-in " + pending.getReference()).build());

        // Update agent stats
        agent.setTotalTransactions(agent.getTotalTransactions() + 1);
        agent.setMonthlyCommission(agent.getMonthlyCommission().add(commission));
        agentRepository.save(agent);

        upsertCustomer(agent.getId(), customer, false);
        publishCashEvent("agent.cashin", agent, pending, commission);

        log.info("CASH_IN completed: ref={} agent={} customer={} amount={}",
                pending.getReference(), agent.getCode(), customer.getPhone(), pending.getAmount());

        return CashOperationResponse.builder()
                .transactionId(pending.getId())
                .reference(pending.getReference())
                .customerName(customer.getFullName().trim())
                .amount(pending.getAmount())
                .fee(cashInFee)
                .netAmount(netAmount)
                .commission(commission)
                .newFloatBalance(newFloat)
                .status("COMPLETED")
                .time(Instant.now())
                .build();
    }

    // ── Cash-Out (agent pays customer) ───────────────────────────

    @Transactional
    public CashOperationResponse cashOut(UUID agentUserId, CashOutRequest req) {
        Agent agent = getAgentByUserIdOrThrow(agentUserId);
        validateAgentActive(agent);

        UserDto customer = lookupUserOrThrow(req.getCustomerPhone());

        AgentTransaction pending = findPendingCashTransaction(
                UUID.fromString(customer.getId()), "CASH_OUT");

        if (!otpEncoder.matches(req.getOtp(), pending.getOtpCodeHash())) {
            throw new InvalidOtpException("Invalid or expired OTP");
        }
        if (pending.getCreatedAt().plus(15, ChronoUnit.MINUTES).isBefore(Instant.now())) {
            pending.setStatus("EXPIRED");
            agentTxnRepository.save(pending);
            throw new InvalidOtpException("Cash-out OTP has expired");
        }

        BigDecimal totalDeduct = pending.getAmount().add(cashOutFee);

        // Agent must have enough float to pay customer
        if (agent.getFloatBalance().compareTo(pending.getAmount()) < 0) {
            throw new InsufficientFloatException(
                    String.format("Agent float insufficient. Float: %.2f, Required: %.2f",
                            agent.getFloatBalance(), pending.getAmount()));
        }

        BigDecimal commission = calculateCommission(pending.getAmount());

        // Debit customer wallet (total + fee)
        try {
            walletClient.debit(WalletOpRequest.build(
                    UUID.fromString(customer.getId()), totalDeduct, "CASH_OUT",
                    pending.getReference(), "Cash-out via Agent " + agent.getCode(), null
            ));
        } catch (Exception e) {
            log.error("Wallet debit failed for cash-out {}: {}", pending.getReference(), e.getMessage());
            throw new RuntimeException("Cash-out failed: wallet debit error");
        }

        // Credit agent float (agent gets the cash amount back)
        agentRepository.creditFloat(agent.getId(), pending.getAmount());
        BigDecimal newFloat = agent.getFloatBalance().add(pending.getAmount());

        pending.setStatus("COMPLETED");
        pending.setCompletedAt(Instant.now());
        agentTxnRepository.save(pending);

        AgentCommission comm = AgentCommission.builder()
                .agentId(agent.getId()).transactionRef(pending.getReference())
                .type("CASH_OUT").transactionAmount(pending.getAmount())
                .commissionAmount(commission).build();
        commissionRepository.save(comm);

        floatHistoryRepository.save(AgentFloatHistory.builder()
                .agentId(agent.getId()).type("CREDIT").amount(pending.getAmount())
                .balanceAfter(newFloat).source("Cash-out " + pending.getReference()).build());

        agent.setTotalTransactions(agent.getTotalTransactions() + 1);
        agent.setMonthlyCommission(agent.getMonthlyCommission().add(commission));
        agentRepository.save(agent);

        upsertCustomer(agent.getId(), customer, false);
        publishCashEvent("agent.cashout", agent, pending, commission);

        log.info("CASH_OUT completed: ref={} agent={} customer={} amount={}",
                pending.getReference(), agent.getCode(), customer.getPhone(), pending.getAmount());

        return CashOperationResponse.builder()
                .transactionId(pending.getId()).reference(pending.getReference())
                .customerName(customer.getFullName().trim()).amount(pending.getAmount())
                .fee(cashOutFee).netAmount(pending.getAmount().subtract(cashOutFee))
                .commission(commission).newFloatBalance(newFloat)
                .status("COMPLETED").time(Instant.now()).build();
    }

    // ── Float Management ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public FloatResponse getFloat(UUID agentUserId) {
        Agent agent = getAgentByUserIdOrThrow(agentUserId);

        List<AgentFloatHistory> history = floatHistoryRepository
                .findByAgentIdOrderByCreatedAtDesc(agent.getId(), PageRequest.of(0, 20));

        List<FloatResponse.FloatHistoryItem> histDtos = history.stream()
                .map(h -> FloatResponse.FloatHistoryItem.builder()
                        .type(h.getType()).amount(h.getAmount())
                        .source(h.getSource()).date(h.getCreatedAt()).build())
                .collect(Collectors.toList());

        int pct = agent.getFloatLimit().compareTo(BigDecimal.ZERO) > 0
                ? agent.getFloatBalance().multiply(BigDecimal.valueOf(100))
                       .divide(agent.getFloatLimit(), 0, RoundingMode.HALF_UP).intValue()
                : 0;

        FloatResponse.LastTopup lastTopup = history.stream()
                .filter(h -> "TOPUP".equals(h.getType()))
                .findFirst()
                .map(h -> FloatResponse.LastTopup.builder().amount(h.getAmount()).date(h.getCreatedAt()).build())
                .orElse(null);

        return FloatResponse.builder()
                .balance(agent.getFloatBalance()).limit(agent.getFloatLimit())
                .percentage(pct).lastTopup(lastTopup).history(histDtos).build();
    }

    @Transactional
    public Map<String, Object> requestFloatTopup(UUID agentUserId, FloatTopupRequest req) {
        Agent agent = getAgentByUserIdOrThrow(agentUserId);

        if (agent.getSuperAgentId() == null) {
            throw new AgentNotFoundException("No super agent assigned to this agent");
        }
        Agent superAgent = agentRepository.findById(agent.getSuperAgentId())
                .orElseThrow(() -> new AgentNotFoundException("Super agent not found"));

        AgentFloatRequest request = AgentFloatRequest.builder()
                .agentId(agent.getId()).superAgentId(superAgent.getId())
                .amount(req.getAmount()).note(req.getNote()).status("PENDING").build();
        floatRequestRepository.save(request);

        return Map.of("requestId", request.getId().toString(), "status", "PENDING",
                "superAgentName", superAgent.getBusinessName() != null
                        ? superAgent.getBusinessName() : "Super Agent " + superAgent.getCode());
    }

    // ── Commission ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CommissionResponse getCommission(UUID agentUserId, String period) {
        Agent agent = getAgentByUserIdOrThrow(agentUserId);
        Instant since = periodToInstant(period);

        BigDecimal total = commissionRepository.sumSince(agent.getId(), since);
        long count       = commissionRepository.countSince(agent.getId(), since);

        BigDecimal avg = count > 0 ? total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                                   : BigDecimal.ZERO;

        List<AgentCommission> entries = commissionRepository
                .findByAgentIdOrderByCreatedAtDesc(agent.getId(), PageRequest.of(0, 100))
                .getContent().stream()
                .filter(c -> c.getCreatedAt().isAfter(since))
                .collect(Collectors.toList());

        // Build daily trend (last 7 days)
        Map<String, BigDecimal> dailyMap = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            String d = LocalDate.now().minusDays(i).toString();
            dailyMap.put(d, BigDecimal.ZERO);
        }
        entries.forEach(e -> {
            String d = e.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().toString();
            dailyMap.merge(d, e.getCommissionAmount(), BigDecimal::add);
        });

        List<CommissionResponse.DailyTrendItem> trend = dailyMap.entrySet().stream()
                .map(en -> CommissionResponse.DailyTrendItem.builder()
                        .date(en.getKey()).commission(en.getValue()).count(0L).build())
                .collect(Collectors.toList());

        return CommissionResponse.builder()
                .totalCommission(total).transactionCount(count)
                .averagePerTransaction(avg).dailyTrend(trend)
                .breakdown(List.of(
                        CommissionResponse.BreakdownItem.builder()
                                .type("CASH_IN").count(count / 2)
                                .volume(total.multiply(BigDecimal.valueOf(333))).commission(total.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP))
                                .build()
                ))
                .build();
    }

    // ── Customers ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AgentCustomer> getCustomers(UUID agentUserId, int page, int size) {
        Agent agent = getAgentByUserIdOrThrow(agentUserId);
        return customerRepository.findByAgentIdOrderByLastTransactionAtDesc(
                agent.getId(), PageRequest.of(page, size));
    }

    // ── Nearby Agents (for customer cash-in/out screen) ──────────

    @Transactional(readOnly = true)
    public List<NearbyAgentResponse> getNearbyAgents(double lat, double lng, double radiusKm) {
        List<Agent> agents = agentRepository.findNearby(lat, lng, radiusKm, PageRequest.of(0, 20));
        return agents.stream().map(a -> NearbyAgentResponse.builder()
                .id(a.getId()).name(a.getBusinessName()).code(a.getCode())
                .distance(calculateDistance(lat, lng, a.getLatitude(), a.getLongitude()))
                .address(a.getAddress()).rating(a.getRating()).isOpen(a.isOpen())
                .build()).collect(Collectors.toList());
    }

    // ── Helpers ──────────────────────────────────────────────────

    private Agent getAgentByUserIdOrThrow(UUID userId) {
        return agentRepository.findByUserId(userId)
                .orElseThrow(() -> new AgentNotFoundException("Agent account not found for user: " + userId));
    }

    private void validateAgentActive(Agent agent) {
        if ("SUSPENDED".equals(agent.getStatus()) || "INACTIVE".equals(agent.getStatus())) {
            throw new AgentSuspendedException("Agent account is " + agent.getStatus().toLowerCase());
        }
    }

    private UserDto lookupUserOrThrow(String phone) {
        try {
            var resp = userClient.findByPhone(phone);
            if (resp != null && resp.hasBody() && resp.getBody() != null) return resp.getBody();
        } catch (Exception ignored) {}
        throw new CustomerNotFoundException("Customer not found: " + phone);
    }

    private AgentTransaction findPendingCashTransaction(UUID customerId, String type) {
        return agentTxnRepository.findAll().stream()
                .filter(t -> t.getCustomerUserId().equals(customerId)
                        && type.equals(t.getType())
                        && "PENDING_AGENT".equals(t.getStatus()))
                .findFirst()
                .orElseThrow(() -> new InvalidOtpException("No pending " + type + " found for customer"));
    }

    private BigDecimal calculateCommission(BigDecimal amount) {
        BigDecimal comm = amount.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        return comm.compareTo(minCommission) < 0 ? minCommission : comm;
    }

    private void upsertCustomer(UUID agentId, UserDto user, boolean registeredByAgent) {
        UUID uid = UUID.fromString(user.getId());
        customerRepository.findByAgentIdAndCustomerUserId(agentId, uid).ifPresentOrElse(c -> {
            c.setLastTransactionAt(Instant.now());
            c.setTotalTransactions(c.getTotalTransactions() + 1);
            customerRepository.save(c);
        }, () -> customerRepository.save(AgentCustomer.builder()
                .agentId(agentId).customerUserId(uid)
                .customerPhone(user.getPhone()).customerName(user.getFullName().trim())
                .kycLevel((short) user.getKycLevel()).lastTransactionAt(Instant.now())
                .totalTransactions(1).registeredByAgent(registeredByAgent).build()));
    }

    private void publishCashEvent(String topic, Agent agent, AgentTransaction txn, BigDecimal commission) {
        try {
            kafka.send(topic, txn.getId().toString(), Map.of(
                    "transactionId",   txn.getId().toString(),
                    "reference",       txn.getReference(),
                    "agentId",         agent.getId().toString(),
                    "agentCode",       agent.getCode(),
                    "customerId",      txn.getCustomerUserId().toString(),
                    "amount",          txn.getAmount().toPlainString(),
                    "commission",      commission.toPlainString(),
                    "timestamp",       Instant.now().toString()
            ));
        } catch (Exception e) {
            log.error("Failed to publish {} event: {}", topic, e.getMessage());
        }
    }

    private Instant periodToInstant(String period) {
        return switch (period != null ? period.toUpperCase() : "MONTH") {
            case "TODAY" -> Instant.now().truncatedTo(ChronoUnit.DAYS);
            case "WEEK"  -> Instant.now().minus(7,  ChronoUnit.DAYS);
            case "MONTH" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default      -> Instant.now().minus(30, ChronoUnit.DAYS);
        };
    }

    private String calculateDistance(double fromLat, double fromLng,
                                     BigDecimal toLat, BigDecimal toLng) {
        if (toLat == null || toLng == null) return "N/A";
        double dx = Math.abs(fromLat - toLat.doubleValue()) * 111;
        double dy = Math.abs(fromLng - toLng.doubleValue()) * 111;
        double km = Math.sqrt(dx * dx + dy * dy);
        return String.format("%.1f km", km);
    }

    private String formatTime(Instant instant) {
        return DateTimeFormatter.ofPattern("hh:mm a")
                .withZone(ZoneOffset.UTC).format(instant);
    }
}
