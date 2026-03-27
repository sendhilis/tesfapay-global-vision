package com.globalpay.auth.controller;

import com.globalpay.auth.dto.*;
import com.globalpay.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth Controller — handles authentication & registration endpoints.
 *
 * Maps to: API_CONTRACT.md §1 (Authentication & Registration)
 * Front-end: LoginPage.tsx, Onboarding.tsx
 *
 * Endpoints:
 *   POST /v1/auth/register          → RegisterResponse (201)
 *   POST /v1/auth/verify-otp        → OtpResponse (200)
 *   POST /v1/auth/login             → LoginResponse (200)
 *   POST /v1/auth/login/biometric   → LoginResponse (200)
 *   POST /v1/auth/refresh           → LoginResponse (200)
 *   POST /v1/auth/logout            → 204 No Content
 */
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /v1/auth/register
     * Begin user registration.
     *
     * Front-end: Onboarding.tsx — Step 3 (Create Account button)
     * Request: { phone, firstName, lastName, pin }
     * Response: { userId, walletId, status: "PENDING_KYC", otpSent: true }
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /v1/auth/verify-otp
     * Verify phone number OTP after registration.
     *
     * Front-end: Onboarding.tsx — OTP verification step
     * Request: { phone, otp }
     * Response: { verified, accessToken, refreshToken }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        // TODO: Implement OTP verification
        // var response = authService.verifyOtp(request);
        // return ResponseEntity.ok(response);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /v1/auth/login
     * MPIN login — user enters phone + 6-digit PIN.
     *
     * Front-end: LoginPage.tsx — Step 2 (numeric keypad, auto-submits on 6th digit)
     * Request: { phone, pin }
     * Response: { accessToken, refreshToken, user: { id, name, walletId, kycLevel } }
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /v1/auth/login/biometric
     * Biometric authentication shortcut.
     *
     * Front-end: LoginPage.tsx — "Use Biometrics Instead" button
     * Request: { userId, biometricToken }
     * Response: Same as /auth/login
     */
    @PostMapping("/login/biometric")
    public ResponseEntity<LoginResponse> biometricLogin(@RequestBody BiometricLoginRequest request) {
        // TODO: Implement biometric token validation
        // var response = authService.biometricLogin(request);
        // return ResponseEntity.ok(response);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /v1/auth/refresh
     * Refresh expired JWT access token using refresh token.
     *
     * Request: { refreshToken }
     * Response: { accessToken, refreshToken }
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /v1/auth/logout
     * Invalidate refresh token, ending the session.
     *
     * Response: 204 No Content
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.noContent().build();
    }
}

// --- Supporting DTOs (create as separate files in production) ---

// VerifyOtpRequest.java
// @Data public class VerifyOtpRequest { String phone; String otp; }

// BiometricLoginRequest.java
// @Data public class BiometricLoginRequest { String userId; String biometricToken; }

// RefreshTokenRequest.java
// @Data public class RefreshTokenRequest { String refreshToken; }
