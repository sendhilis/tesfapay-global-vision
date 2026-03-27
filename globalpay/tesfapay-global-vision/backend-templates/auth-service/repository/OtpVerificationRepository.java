package com.globalpay.auth.repository;

import com.globalpay.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {

    Optional<OtpVerification> findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
            String phone, String purpose);
}
