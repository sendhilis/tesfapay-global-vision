package com.globalpay.repository;

import com.globalpay.model.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {

    @Query("SELECT o FROM OtpCode o WHERE o.phone = :phone AND o.purpose = :purpose " +
           "AND o.verified = false AND o.expiresAt > CURRENT_TIMESTAMP " +
           "ORDER BY o.createdAt DESC")
    Optional<OtpCode> findLatestValidOtp(String phone, String purpose);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.expiresAt < :now")
    void deleteExpired(Instant now);

    @Modifying
    @Query("UPDATE OtpCode o SET o.attempts = o.attempts + 1 WHERE o.id = :id")
    void incrementAttempts(UUID id);
}
