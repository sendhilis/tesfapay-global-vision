package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
@Entity @Table(name = "loan_repayments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanRepayment {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(name = "principal_portion", precision = 18, scale = 2) private BigDecimal principalPortion;
    @Column(name = "interest_portion", precision = 18, scale = 2) private BigDecimal interestPortion;
    @Column(name = "balance_after", precision = 18, scale = 2) private BigDecimal balanceAfter;
    @Column(name = "wallet_txn_id") private UUID walletTxnId;
    @Column(name = "due_date") private LocalDate dueDate;
    @Column(name = "paid_at", nullable = false) private Instant paidAt = Instant.now();
}