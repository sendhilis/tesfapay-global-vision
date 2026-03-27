package com.globalpay.service;

import com.globalpay.client.WalletClient;
import com.globalpay.model.entity.SavingsGoal;
import com.globalpay.repository.SavingsGoalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j @Service @RequiredArgsConstructor
public class SavingsService {

    private final SavingsGoalRepository goalRepo;
    private final WalletClient walletClient;
    private final KafkaTemplate<String, Object> kafka;

    @Transactional(readOnly = true)
    public Map<String, Object> getGoals(UUID userId) {
        List<SavingsGoal> goals = goalRepo.findByUserIdOrderByCreatedAtDesc(userId);
        BigDecimal totalSaved = goals.stream()
                .map(SavingsGoal::getSavedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("totalSaved", totalSaved, "monthlyGrowth", BigDecimal.ZERO, "goals", goals);
    }

    @Transactional
    public SavingsGoal createGoal(UUID userId, String name, String icon,
                                   BigDecimal targetAmount, String deadline) {
        SavingsGoal goal = SavingsGoal.builder()
                .userId(userId).name(name).icon(icon).targetAmount(targetAmount)
                .savedAmount(BigDecimal.ZERO).status("ACTIVE")
                .deadline(deadline != null ? LocalDate.parse(deadline) : null)
                .build();
        return goalRepo.save(goal);
    }

    @Transactional
    public Map<String, Object> deposit(UUID userId, UUID goalId, BigDecimal amount) {
        SavingsGoal goal = goalRepo.findById(goalId)
                .filter(g -> g.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Savings goal not found"));

        String ref = genRef("SVG");
        var walletResp = walletClient.debit(userId, amount, "SAVINGS_DEPOSIT", ref,
                "Savings: " + goal.getName(), null);

        goal.setSavedAmount(goal.getSavedAmount().add(amount));
        goalRepo.save(goal);

        publish("savings.deposited", Map.of("goalId", goalId, "userId", userId, "amount", amount.toPlainString()));

        return Map.of("transactionId", UUID.randomUUID(), "reference", ref,
                "newSavedAmount", goal.getSavedAmount(),
                "percentComplete", goal.getPercentComplete(),
                "newMainBalance", walletResp != null ? walletResp.getNewBalance() : BigDecimal.ZERO);
    }

    @Transactional
    public Map<String, Object> withdraw(UUID userId, UUID goalId, BigDecimal amount) {
        SavingsGoal goal = goalRepo.findById(goalId)
                .filter(g -> g.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Savings goal not found"));

        if (goal.getSavedAmount().compareTo(amount) < 0)
            throw new RuntimeException("Insufficient savings balance");

        String ref = genRef("SVW");
        var walletResp = walletClient.credit(userId, amount, "SAVINGS_WITHDRAWAL", ref,
                "Savings withdrawal: " + goal.getName(), null);

        goal.setSavedAmount(goal.getSavedAmount().subtract(amount));
        goalRepo.save(goal);

        return Map.of("transactionId", UUID.randomUUID(), "reference", ref,
                "newSavedAmount", goal.getSavedAmount(),
                "newMainBalance", walletResp != null ? walletResp.getNewBalance() : BigDecimal.ZERO);
    }

    @Transactional
    public void deleteGoal(UUID userId, UUID goalId) {
        SavingsGoal goal = goalRepo.findById(goalId)
                .filter(g -> g.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        goal.setStatus("CANCELLED");
        goalRepo.save(goal);
    }

    private String genRef(String p) {
        return String.format("%s%s%05d", p, DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now()),
                (int)(Math.random() * 99999));
    }

    private void publish(String topic, Map<String, Object> data) {
        try { kafka.send(topic, data.get("goalId").toString(), data); }
        catch (Exception e) { log.error("Kafka: {}", e.getMessage()); }
    }
}
