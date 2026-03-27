package com.globalpay.repository;

import com.globalpay.model.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository public interface LoanRepository extends JpaRepository<Loan, UUID> {
    List<Loan> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, String status);
    boolean existsByUserIdAndStatusIn(UUID userId, List<String> statuses);
    Optional<Loan> findByReference(String ref);
}

@Repository interface LoanRepaymentRepository extends JpaRepository<LoanRepayment, UUID> {
    List<LoanRepayment> findByLoanIdOrderByInstallmentNumAsc(UUID loanId);
}

@Repository interface CreditScoreRepository extends JpaRepository<com.globalpay.model.entity.CreditScore, UUID> {
    Optional<com.globalpay.model.entity.CreditScore> findByUserId(UUID userId);
}
