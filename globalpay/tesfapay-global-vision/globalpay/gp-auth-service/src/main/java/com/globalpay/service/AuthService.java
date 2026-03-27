package com.globalpay.service;

import com.globalpay.exception.*;
import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.model.entity.*;
import com.globalpay.model.enums.AppRole;
import com.globalpay.repository.*;
import com.globalpay.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final OtpService otpService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final WalletIdGenerator walletIdGenerator;

    @Value("${security.max-failed-pin-attempts:5}")
    private int maxFailedAttempts;

    @Value("${security.lockout-duration-minutes:30}")
    private int lockoutMinutes;

    // ── Register ─────────────────────────────────────────────────

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new UserAlreadyExistsException("Phone number already registered: " + request.getPhone());
        }

        String walletId = walletIdGenerator.generate(request.getFirstName());

        User user = User.builder()
                .phone(request.getPhone())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .pinHash(passwordEncoder.encode(request.getPin()))
                .walletId(walletId)
                .kycLevel((short) 1)
                .status("PENDING_KYC")
                .build();

        UserRole role = UserRole.builder()
                .user(user)
                .role(AppRole.USER)
                .build();
        user.getRoles().add(role);

        userRepository.save(user);

        // Send OTP for phone verification
        otpService.generateAndSend(request.getPhone(), "REGISTRATION");

        log.info("New user registered: phone={} walletId={}", request.getPhone(), walletId);

        return RegisterResponse.builder()
                .userId(user.getId().toString())
                .walletId(walletId)
                .status("PENDING_KYC")
                .otpSent(true)
                .message("Registration successful. Please verify your phone number with the OTP sent.")
                .build();
    }

    // ── Verify OTP ───────────────────────────────────────────────

    @Transactional
    public OtpVerifyResponse verifyOtp(VerifyOtpRequest request) {
        otpService.verify(request.getPhone(), request.getOtp(), "REGISTRATION");

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new UsernameNotFoundRuntimeException("User not found"));

        // Activate account after OTP verified
        if ("PENDING_KYC".equals(user.getStatus()) || "PENDING_OTP".equals(user.getStatus())) {
            user.setStatus("ACTIVE");
            userRepository.save(user);
        }

        String accessToken  = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = createAndSaveRefreshToken(user, null);

        userRepository.updateLastLogin(user.getId());

        return OtpVerifyResponse.builder()
                .verified(true)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .message("Phone verified successfully.")
                .build();
    }

    // ── Login (MPIN) ─────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new InvalidPinException("Invalid phone or PIN"));

        // Check lock
        if (user.isLocked()) {
            throw new AccountLockedException("Account is locked until " + user.getLockedUntil());
        }

        // Check status
        if ("SUSPENDED".equals(user.getStatus()) || "BLOCKED".equals(user.getStatus())) {
            throw new AccountLockedException("Account is " + user.getStatus().toLowerCase());
        }

        // Verify PIN
        if (!passwordEncoder.matches(request.getPin(), user.getPinHash())) {
            handleFailedAttempt(user);
            int remaining = maxFailedAttempts - user.getFailedPinAttempts();
            throw new InvalidPinException("Invalid PIN. " + Math.max(remaining, 0) + " attempts remaining.");
        }

        // Reset failed attempts on success
        userRepository.resetFailedPinAttempts(user.getId());
        userRepository.updateLastLogin(user.getId());

        String accessToken  = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = createAndSaveRefreshToken(user, request.getDeviceInfo());

        log.info("User logged in: phone={}", request.getPhone());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    // ── Biometric Login ──────────────────────────────────────────

    @Transactional
    public AuthResponse biometricLogin(BiometricLoginRequest request) {
        User user = userRepository.findById(UUID.fromString(request.getUserId()))
                .orElseThrow(() -> new InvalidPinException("User not found"));

        if (user.isLocked()) {
            throw new AccountLockedException("Account is locked");
        }

        if (user.getBiometricToken() == null ||
                !user.getBiometricToken().equals(request.getBiometricToken())) {
            throw new InvalidPinException("Biometric verification failed");
        }

        userRepository.updateLastLogin(user.getId());

        String accessToken  = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = createAndSaveRefreshToken(user, request.getDeviceInfo());

        log.info("Biometric login: userId={}", user.getId());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    // ── Refresh Token ────────────────────────────────────────────

    @Transactional
    public TokenRefreshResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = hashToken(request.getRefreshToken());

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new TokenRefreshException("Refresh token not found"));

        if (stored.isRevoked()) {
            throw new TokenRefreshException("Refresh token has been revoked");
        }
        if (stored.isExpired()) {
            refreshTokenRepository.delete(stored);
            throw new TokenRefreshException("Refresh token has expired. Please login again.");
        }

        User user = stored.getUser();

        // Rotate: revoke old, issue new
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        String newAccessToken  = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = createAndSaveRefreshToken(user, stored.getDeviceInfo());

        return TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiryMs() / 1000)
                .build();
    }

    // ── Logout ───────────────────────────────────────────────────

    @Transactional
    public void logout(String userId) {
        refreshTokenRepository.revokeAllByUserId(UUID.fromString(userId));
        log.info("User logged out: userId={}", userId);
    }

    // ── Change PIN ───────────────────────────────────────────────

    @Transactional
    public void changePin(String userId, ChangePinRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new InvalidPinException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPin(), user.getPinHash())) {
            handleFailedAttempt(user);
            throw new InvalidPinException("Current PIN is incorrect");
        }

        user.setPinHash(passwordEncoder.encode(request.getNewPin()));
        userRepository.save(user);

        // Invalidate all sessions after PIN change
        refreshTokenRepository.revokeAllByUserId(user.getId());

        log.info("PIN changed for userId={}", userId);
    }

    // ── Change PIN by Phone (used by controller) ─────────────────

    @Transactional
    public void changePinByPhone(String phone, ChangePinRequest request) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new InvalidPinException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPin(), user.getPinHash())) {
            handleFailedAttempt(user);
            throw new InvalidPinException("Current PIN is incorrect");
        }

        user.setPinHash(passwordEncoder.encode(request.getNewPin()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUserId(user.getId());
        log.info("PIN changed for phone={}", phone);
    }

    // ── Internal Helpers ─────────────────────────────────────────

    private String createAndSaveRefreshToken(User user, String deviceInfo) {
        // Generate a random opaque token
        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);

        // Revoke any old tokens for this device first (optional: keep multiple sessions)
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .deviceInfo(deviceInfo)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        // Return the raw token (sent to client, never stored raw)
        return rawToken;
    }

    private void handleFailedAttempt(User user) {
        userRepository.incrementFailedPinAttempts(user.getId());
        // Reload to get updated count
        User updated = userRepository.findById(user.getId()).orElse(user);
        if (updated.getFailedPinAttempts() >= maxFailedAttempts) {
            updated.setLockedUntil(Instant.now().plus(lockoutMinutes, ChronoUnit.MINUTES));
            userRepository.save(updated);
            log.warn("Account locked after {} failed attempts: phone={}", maxFailedAttempts, user.getPhone());
        }
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        String role = user.getRoles().stream()
                .map(r -> r.getRole().name())
                .findFirst()
                .orElse("USER");

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiryMs() / 1000)
                .user(AuthResponse.UserSummary.builder()
                        .id(user.getId().toString())
                        .name(user.getFullName())
                        .phone(user.getPhone())
                        .walletId(user.getWalletId())
                        .kycLevel(user.getKycLevel())
                        .role(role)
                        .status(user.getStatus())
                        .build())
                .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }

    // Inner helper — avoids importing Spring's UsernameNotFoundException in service layer
    private static class UsernameNotFoundRuntimeException extends RuntimeException {
        public UsernameNotFoundRuntimeException(String msg) { super(msg); }
    }
}
