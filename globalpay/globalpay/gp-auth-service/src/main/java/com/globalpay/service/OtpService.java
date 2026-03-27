package com.globalpay.service;

import com.globalpay.exception.InvalidOtpException;
import com.globalpay.model.entity.OtpCode;
import com.globalpay.repository.OtpCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${otp.validity-seconds:300}")
    private int validitySeconds;

    @Value("${otp.mock-enabled:true}")
    private boolean mockEnabled;

    private final SecureRandom secureRandom = new SecureRandom();

    // ── Generate & Send ──────────────────────────────────────────

    @Transactional
    public String generateAndSend(String phone, String purpose) {
        String code = generateCode();
        String hash = passwordEncoder.encode(code);

        OtpCode otp = OtpCode.builder()
                .phone(phone)
                .codeHash(hash)
                .purpose(purpose)
                .attempts((short) 0)
                .maxAttempts((short) 3)
                .verified(false)
                .expiresAt(Instant.now().plusSeconds(validitySeconds))
                .build();

        otpCodeRepository.save(otp);

        if (mockEnabled) {
            // DEV MODE: log the OTP instead of sending SMS
            log.info("🔑 [DEV OTP] Phone={} Purpose={} Code={}", phone, purpose, code);
        } else {
            sendSms(phone, code);
        }

        return code; // return in dev only; don't expose in prod
    }

    // ── Verify ───────────────────────────────────────────────────

    @Transactional
    public void verify(String phone, String code, String purpose) {
        OtpCode otp = otpCodeRepository.findLatestValidOtp(phone, purpose)
                .orElseThrow(() -> new InvalidOtpException("OTP not found or expired"));

        if (otp.isExpired()) {
            throw new InvalidOtpException("OTP has expired");
        }
        if (otp.isMaxAttemptsReached()) {
            throw new InvalidOtpException("Maximum OTP attempts reached");
        }

        otpCodeRepository.incrementAttempts(otp.getId());

        if (!passwordEncoder.matches(code, otp.getCodeHash())) {
            throw new InvalidOtpException("Invalid OTP code");
        }

        // Mark as verified
        otp.setVerified(true);
        otpCodeRepository.save(otp);
    }

    // ── Cleanup (scheduled) ──────────────────────────────────────

    @Scheduled(fixedDelay = 300_000) // every 5 minutes
    @Transactional
    public void cleanupExpired() {
        otpCodeRepository.deleteExpired(Instant.now());
    }

    // ── Helpers ──────────────────────────────────────────────────

    private String generateCode() {
        int code = 100_000 + secureRandom.nextInt(900_000);
        return String.valueOf(code);
    }

    private void sendSms(String phone, String code) {
        // TODO: Integrate Africa's Talking or Twilio
        // AfricasTalkingGateway gateway = new AfricasTalkingGateway(apiKey, username);
        // gateway.sendMessage(phone, "Your GlobalPay OTP is: " + code + ". Valid for 5 mins.");
        log.info("SMS to {} with OTP: {}", phone, code);
    }
}
