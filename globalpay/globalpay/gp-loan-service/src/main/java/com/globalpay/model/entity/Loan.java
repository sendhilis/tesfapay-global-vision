package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "loans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Loan {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(nullable = false, unique = true, length = 30) private String reference;
    @Column(name = "principal_amount", nullable = false, precision = 18, scale = 2) private BigDecimal principalAmount;
    @Column(name = "interest_rate", nullable = false, precision = 5, scale = 4) private BigDecimal interestRate;
    @Column(name = "total_repayment", nullable = false, precision = 18, scale = 2) private BigDecimal totalRepayment;
    @Column(name = "monthly_payment", nullable = false, precision = 18, scale = 2) private BigDecimal monthlyPayment;
    @Column(name = "term_months", nullable = false) private Short termMonths;
    @Column(name = "paid_installments", nullable = false) private Short paidInstallments = 0;
    @Column(name = "outstanding_balance", nullable = false, precision = 18, scale = 2) private BigDecimal outstandingBalance;
    @Column(length = 200) private String purpose;
    @Column(nullable = false, length = 20) private String status = "ACTIVE";
    @Column(name = "next_due_date", nullable = false) private LocalDate nextDueDate;
    @Column(name = "disbursed_at", updatable = false) private Instant disbursedAt = Instant.now();
    @Column(name = "completed_at") private Instant completedAt;
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
    @OneToMany(mappedBy = "loan", fetch = FetchType.LAZY) private List<LoanRepayment> repayments;
}
