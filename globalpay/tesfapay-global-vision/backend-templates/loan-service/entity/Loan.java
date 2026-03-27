package com.globalpay.loan.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Loan entity.
 * Maps to: DATABASE_SCHEMA.md §7 (loans table)
 * Front-end: MicroLoan.tsx
 */
@Entity
@Table(name = "loans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Column(name = "principal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal interestRate;

    @Column(name = "total_repayment", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalRepayment;

    @Column(name = "monthly_payment", nullable = false, precision = 18, scale = 2)
    private BigDecimal monthlyPayment;

    @Column(name = "term_months", nullable = false)
    private Short termMonths;

    @Column(name = "paid_installments")
    @Builder.Default
    private Short paidInstallments = 0;

    @Column(name = "outstanding_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal outstandingBalance;

    @Column(length = 200)
    private String purpose;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";  // ACTIVE | OVERDUE | COMPLETED | DEFAULTED

    @Column(name = "disbursement_txn_id")
    private UUID disbursementTxnId;

    @Column(name = "next_due_date", nullable = false)
    private LocalDate nextDueDate;

    @Column(name = "disbursed_at", nullable = false)
    @Builder.Default
    private Instant disbursedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
