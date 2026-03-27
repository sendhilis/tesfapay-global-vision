package com.globalpay.repository;

import com.globalpay.model.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository public interface TelecomOperatorRepository extends JpaRepository<TelecomOperator, UUID> {
    List<TelecomOperator> findByActiveTrue();
}

@Repository public interface AirtimeBundleRepository extends JpaRepository<AirtimeBundle, UUID> {
    List<AirtimeBundle> findByOperatorIdAndActiveTrueOrderBySortOrderAsc(UUID operatorId);
}

@Repository public interface MerchantRepository extends JpaRepository<Merchant, UUID> {
    Optional<Merchant> findByMerchantId(String merchantId);
    List<Merchant> findByCategoryAndStatus(String category, String status);
    @Query("SELECT m FROM Merchant m WHERE LOWER(m.name) LIKE LOWER(CONCAT('%',:q,'%')) AND m.status='ACTIVE'")
    List<Merchant> search(String q);
    @Query("SELECT m FROM Merchant m WHERE m.qrPayload LIKE CONCAT('%',:payload,'%')")
    Optional<Merchant> findByQrPayload(String payload);
}

@Repository public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    Optional<PaymentTransaction> findByIdempotencyKey(String key);
    Optional<PaymentTransaction> findByReference(String ref);
}
