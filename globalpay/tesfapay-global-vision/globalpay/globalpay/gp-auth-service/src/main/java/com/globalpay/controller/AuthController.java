package com.globalpay.controller;

import com.globalpay.model.dto.request.*;
import com.globalpay.model.dto.response.*;
import com.globalpay.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, Login, OTP, Token Management")
public class AuthController {

    private final AuthService authService;

    // ── POST /auth/register ──────────────────────────────────────

    @Operation(summary = "Register a new user", description = "Creates account and sends OTP to phone")
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── POST /auth/verify-otp ────────────────────────────────────

    @Operation(summary = "Verify OTP", description = "Verifies phone number with OTP; returns JWT on success")
    @PostMapping("/verify-otp")
    public ResponseEntity<OtpVerifyResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        OtpVerifyResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    // ── POST /auth/login ─────────────────────────────────────────

    @Operation(summary = "Login with MPIN", description = "Authenticate with phone + 6-digit MPIN")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // ── POST /auth/login/biometric ───────────────────────────────

    @Operation(summary = "Biometric login", description = "Authenticate using device biometric token")
    @PostMapping("/login/biometric")
    public ResponseEntity<AuthResponse> biometricLogin(
            @Valid @RequestBody BiometricLoginRequest request) {
        AuthResponse response = authService.biometricLogin(request);
        return ResponseEntity.ok(response);
    }

    // ── POST /auth/refresh ───────────────────────────────────────

    @Operation(summary = "Refresh access token", description = "Exchange refresh token for new access + refresh tokens")
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    // ── POST /auth/logout ────────────────────────────────────────

    @Operation(summary = "Logout", description = "Revokes all refresh tokens for the authenticated user")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails) {
        // userId is embedded in the JWT claims; we resolve via phone→user in service
        // For simplicity we pass the phone as userId signal here
        authService.logout(userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // ── PUT /auth/change-pin ─────────────────────────────────────

    @Operation(summary = "Change MPIN", description = "Change the user's 6-digit MPIN; invalidates all sessions")
    @PutMapping("/change-pin")
    public ResponseEntity<Void> changePin(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePinRequest request) {
        // Resolve real userId from phone via SecurityContext username
        authService.changePinByPhone(userDetails.getUsername(), request);
        return ResponseEntity.noContent().build();
    }

    // ── GET /auth/me ─────────────────────────────────────────────

    @Operation(summary = "Current user info", description = "Returns basic identity info from JWT")
    @GetMapping("/me")
    public ResponseEntity<?> me(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(java.util.Map.of(
                "phone",       userDetails.getUsername(),
                "authorities", userDetails.getAuthorities()
        ));
    }
}
