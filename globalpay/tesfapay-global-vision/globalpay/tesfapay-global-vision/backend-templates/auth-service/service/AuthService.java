package com.globalpay.auth.service;

import com.globalpay.auth.dto.*;
import com.globalpay.auth.entity.*;
import com.globalpay.auth.repository.*;
import com.globalpay.common.enums.AppRole;
import com.globalpay.common.enums.UserStatus;
import com.globalpay.common.exception.*;
import com.globalpay.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Auth service — handles registration, login, OTP, token refresh.
 *
 * Maps to: API_CONTRACT.md §1 (Authentication & Registration)
 * Front-end: LoginPage.tsx, Onboarding.tsx
 *
 * NOTE: This service also creates Wallet via Feign client to wallet-service.
 * In a monolith-first approach, wallet creation can be local.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserSessionRepository sessionRepository;
    private final OtpVerificationRepository otpRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    // private final WalletServiceClient walletClient;  // OpenFeign — uncomment when wallet-service is ready

    private static final int MAX_PIN_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 30;

    /**
     * Register a new user.
     * POST /auth/register → { phone, firstName, lastName, pin } → RegisterResponse
     *
     * Steps:
     * 1. Check phone uniqueness
     * 2. Generate wallet ID (TPY-YYYY-NAMEXXXX)
     * 3. Hash PIN with BCrypt
     * 4. Create user record
     * 5. Assign USER role
     * 6. Create wallet via wallet-service (Feign)
     * 7. Send OTP for phone verification
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // 1. Uniqueness check
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateTransactionException("Phone number already registered");
        }

        // 2. Generate wallet ID
        String walletId = generateWalletId(request.getFirstName());

        // 3-4. Create user
        User user = User.builder()
                .phone(request.getPhone())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .pinHash(passwordEncoder.encode(request.getPin()))
                .walletId(walletId)
                .kycLevel((short) 1)
                .status(UserStatus.PENDING_KYC)
                .build();
        user = userRepository.save(user);

        // 5. Assign default USER role
        UserRole role = UserRole.builder()
                .userId(user.getId())
                .role(AppRole.USER)
                .build();
        userRoleRepository.save(role);

        // 6. Create wallet (uncomment when wallet-service is ready)
        // walletClient.createWallet(new CreateWalletRequest(user.getId(), walletId));

        // 7. Send OTP (implement SMS integration)
        sendOtp(user.getPhone(), user.getId(), "REGISTRATION");

        log.info("User registered: {} with wallet {}", user.getId(), walletId);

        return RegisterResponse.builder()
                .userId(user.getId().toString())
                .walletId(walletId)
                .status("PENDING_KYC")
                .otpSent(true)
                .build();
    }

    /**
     * Login with phone + MPIN.
     * POST /auth/login → { phone, pin } → LoginResponse with JWT tokens
     *
     * Security:
     * - Verify PIN against BCrypt hash
     * - Lock account after 5 failed attempts for 30 minutes
     * - Update last_login_at
     * - Create session record with refresh token
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // Find user
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new InvalidPinException("Invalid credentials"));

        // Check account lock
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            throw new AccountLockedException(
                    "Account locked until " + user.getLockedUntil() + ". Try again later.");
        }

        // Verify PIN
        if (!passwordEncoder.matches(request.getPin(), user.getPinHash())) {
            handleFailedPin(user);
            throw new InvalidPinException("Invalid credentials");
        }

        // Reset failed attempts on success
        user.setFailedPinAttempts((short) 0);
        user.setLockedUntil(null);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // Get primary role
        String role = userRoleRepository.findByUserId(user.getId())
                .stream()
                .findFirst()
                .map(r -> r.getRole().name())
                .orElse("USER");

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getWalletId(), role, user.getKycLevel());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // Save session
        UserSession session = UserSession.builder()
                .userId(user.getId())
                .refreshToken(refreshToken)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        sessionRepository.save(session);

        log.info("User logged in: {}", user.getId());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(LoginResponse.UserSummary.builder()
                        .id(user.getId().toString())
                        .name(user.getFirstName() + " " + user.getLastName())
                        .walletId(user.getWalletId())
                        .kycLevel(user.getKycLevel())
                        .build())
                .build();
    }

    /**
     * Refresh JWT access token.
     * POST /auth/refresh → { refreshToken } → { accessToken, refreshToken }
     */
    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        // Validate refresh token exists in DB
        UserSession session = sessionRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new InvalidPinException("Invalid refresh token"));

        // Check expiry
        if (session.getExpiresAt().isBefore(Instant.now())) {
            sessionRepository.delete(session);
            throw new InvalidPinException("Refresh token expired");
        }

        // Get user
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = userRoleRepository.findByUserId(user.getId())
                .stream().findFirst()
                .map(r -> r.getRole().name())
                .orElse("USER");

        // Rotate tokens
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getWalletId(), role, user.getKycLevel());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // Update session
        session.setRefreshToken(newRefreshToken);
        session.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        sessionRepository.save(session);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    /**
     * Logout — invalidate refresh token.
     * POST /auth/logout → 204 No Content
     */
    @Transactional
    public void logout(String refreshToken) {
        sessionRepository.deleteByRefreshToken(refreshToken);
    }

    // --- Private helpers ---

    private void handleFailedPin(User user) {
        short attempts = (short) (user.getFailedPinAttempts() + 1);
        user.setFailedPinAttempts(attempts);

        if (attempts >= MAX_PIN_ATTEMPTS) {
            user.setLockedUntil(Instant.now().plus(LOCKOUT_MINUTES, ChronoUnit.MINUTES));
            log.warn("Account locked for user {} after {} failed attempts", user.getId(), attempts);
        }

        userRepository.save(user);
    }

    private String generateWalletId(String firstName) {
        String prefix = firstName.toUpperCase().substring(0, Math.min(5, firstName.length()));
        String year = String.valueOf(java.time.Year.now().getValue());
        String suffix = String.format("%03d", (int) (Math.random() * 999) + 1);
        return "TPY-" + year + "-" + prefix + suffix;
    }

    private void sendOtp(String phone, UUID userId, String purpose) {
        // TODO: Integrate with SMS gateway (e.g., Twilio, Africa's Talking)
        String otp = String.format("%06d", (int) (Math.random() * 999999));
        OtpVerification otpRecord = OtpVerification.builder()
                .userId(userId)
                .phone(phone)
                .code(passwordEncoder.encode(otp))
                .purpose(purpose)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .build();
        otpRepository.save(otpRecord);
        log.info("OTP generated for {} (purpose: {}). In dev mode: {}", phone, purpose, otp);
    }
}
