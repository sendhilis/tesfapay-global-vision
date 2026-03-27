package com.globalpay.service;

import com.globalpay.client.WalletClient;
import com.globalpay.model.entity.*;
import com.globalpay.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j @Service @RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepo;
    private final WalletClient walletClient;
    private final KafkaTemplate<String, Object> kafka;

    // ── Eligibility ──────────────────────────────────────────────

    public Map<String, Object> checkEligibility(UUID userId) {
        boolean hasActiveLoan = loanRepo.existsByUserIdAndStatusIn(userId, List.of("ACTIVE", "OVERDUE"));
        int score = hasActiveLoan ? 40 : 78;
        BigDecimal maxLoan = hasActiveLoan ? BigDecimal.ZERO : new BigDecimal("8000.00");

        return Map.of(
                "eligible", !hasActiveLoan,
                "aiCreditScore", score,
                "scoreLabel", score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor",
                "maxLoanAmount", maxLoan,
                "activeLoans", hasActiveLoan ? 1 : 0,
                "factors", List.of(
                        Map.of("label", "Transaction History", "score", 85, "weight", "HIGH"),
                        Map.of("label", "Account Age", "score", 72, "weight", "MEDIUM"),
                        Map.of("label", "Savings Behavior", "score", 90, "weight", "MEDIUM"),
                        Map.of("label", "Repayment History", "score", 65, "weight", "HIGH")
                ));
    }

    // ── Repayment Plans ──────────────────────────────────────────

    public Map<String, Object> getPlans(BigDecimal amount) {
        List<Map<String, Object>> plans = new ArrayList<>();
        int[] months = {1, 3, 6};
        double[] rates = {0.02, 0.05, 0.10};
        for (int i = 0; i < months.length; i++) {
            BigDecimal interest = BigDecimal.valueOf(rates[i]);
            BigDecimal total    = amount.multiply(BigDecimal.ONE.add(interest)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal monthly  = total.divide(BigDecimal.valueOf(months[i]), 2, RoundingMode.HALF_UP);
            plans.add(Map.of("months", months[i], "interestRate", rates[i],
                    "totalRepayment", total, "monthlyPayment", monthly));
        }
        return Map.of("plans", plans);
    }

    // ── Apply ─────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> applyForLoan(UUID userId, BigDecimal amount,
                                              int termMonths, String purpose) {
        if (loanRepo.existsByUserIdAndStatusIn(userId, List.of("ACTIVE", "OVERDUE")))
            throw new RuntimeException("Active loan already exists");

        double rate = termMonths == 1 ? 0.02 : termMonths == 3 ? 0.05 : 0.10;
        BigDecimal interest = BigDecimal.valueOf(rate);
        BigDecimal total    = amount.multiply(BigDecimal.ONE.add(interest)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal monthly  = total.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        String ref          = genRef("LNS");

        Loan loan = Loan.builder()
                .userId(userId).reference(ref).principalAmount(amount)
                .interestRate(interest).totalRepayment(total).monthlyPayment(monthly)
                .termMonths((short) termMonths).paidInstallments((short) 0)
                .outstandingBalance(total).purpose(purpose).status("ACTIVE")
                .nextDueDate(LocalDate.now().plusMonths(1)).build();
        loanRepo.save(loan);

        // Disburse to wallet
        var walletResp = walletClient.credit(userId, amount, "LOAN_DISBURSEMENT", ref,
                "Micro-loan disbursement", purpose);

        publish("loan.disbursed", Map.of("loanId", loan.getId(), "userId", userId, "amount", amount.toPlainString()));

        return Map.of("loanId", loan.getId(), "reference", ref,
                "amount", amount, "totalRepayment", total, "monthlyPayment", monthly,
                "termMonths", termMonths, "interestRate", rate,
                "nextDueDate", loan.getNextDueDate().toString(), "status", "DISBURSED",
                "newMainBalance", walletResp != null ? walletResp.getNewBalance() : BigDecimal.ZERO,
                "createdAt", loan.getCreatedAt());
    }

    // ── Active Loans ─────────────────────────────────────────────

    public Map<String, Object> getActiveLoans(UUID userId) {
        return Map.of("loans", loanRepo.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE"));
    }

    // ── Repay ────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> repay(UUID userId, UUID loanId, BigDecimal amount) {
        Loan loan = loanRepo.findById(loanId)
                .filter(l -> l.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Loan not found"));

        String ref = genRef("RPY");
        walletClient.debit(userId, amount, "LOAN_REPAYMENT", ref, "Loan repayment: " + loan.getReference(), null);

        loan.setOutstandingBalance(loan.getOutstandingBalance().subtract(amount).max(BigDecimal.ZERO));
        loan.setPaidInstallments((short)(loan.getPaidInstallments() + 1));
        if (loan.getOutstandingBalance().compareTo(BigDecimal.ZERO) == 0) {
            loan.setStatus("COMPLETED");
            loan.setCompletedAt(Instant.now());
        } else {
            loan.setNextDueDate(loan.getNextDueDate().plusMonths(1));
        }
        loanRepo.save(loan);

        publish("loan.repaid", Map.of("loanId", loanId, "userId", userId, "amount", amount.toPlainString()));

        return Map.of("transactionId", UUID.randomUUID(), "newOutstandingBalance",
                loan.getOutstandingBalance(), "paidInstallments", loan.getPaidInstallments(),
                "status", loan.getStatus());
    }

    private String genRef(String p) {
        return String.format("%s%s%05d", p, DateTimeFormatter.ofPattern("yyyyMMdd")
                .format(LocalDate.now()), (int)(Math.random() * 99999));
    }

    private void publish(String topic, Map<String, Object> data) {
        try { kafka.send(topic, data.get("loanId").toString(), data); }
        catch (Exception e) { log.error("Kafka: {}", e.getMessage()); }
    }
}
