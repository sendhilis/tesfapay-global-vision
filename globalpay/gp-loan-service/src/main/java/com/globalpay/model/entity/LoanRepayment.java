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
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "loan_id") private Loan loan;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(name = "installment_num", nullable = false) private Short installmentNum;
    @Column(name = "balance_after", nullable = false, precision = 18, scale = 2) private BigDecimal balanceAfter;
    @Column(name = "due_date", nullable = false) private LocalDate dueDate;
    @Column(name = "paid_at", nullable = false) private Instant paidAt = Instant.now();
}