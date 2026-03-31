package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    Optional<PaymentTransaction> findByIdempotencyKey(String key);
    Optional<PaymentTransaction> findByReference(String ref);
}
