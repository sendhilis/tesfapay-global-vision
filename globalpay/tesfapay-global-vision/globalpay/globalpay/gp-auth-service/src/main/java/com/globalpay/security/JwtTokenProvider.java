package com.globalpay.security;

import com.globalpay.model.entity.User;
import com.globalpay.model.enums.AppRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${jwt.refresh-expiry-ms}")
    private long refreshTokenExpiryMs;

    // ── Access Token ─────────────────────────────────────────────

    public String generateAccessToken(User user) {
        String role = user.getRoles().stream()
                .map(r -> r.getRole().name())
                .findFirst()
                .orElse(AppRole.USER.name());

        return Jwts.builder()
                .subject(user.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiryMs))
                .issuer("gp-auth-service")
                .claims(Map.of(
                        "phone",    user.getPhone(),
                        "walletId", user.getWalletId(),
                        "role",     role,
                        "kycLevel", user.getKycLevel(),
                        "status",   user.getStatus()
                ))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Refresh Token ────────────────────────────────────────────

    public String generateRefreshToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiryMs))
                .issuer("gp-auth-service")
                .claim("type", "REFRESH")
                .id(UUID.randomUUID().toString())
                .signWith(getSigningKey())
                .compact();
    }

    // ── Validate ─────────────────────────────────────────────────

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
        }
        return false;
    }

    // ── Extract Claims ───────────────────────────────────────────

    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUserIdFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return getClaims(token).get("role", String.class);
    }

    public long getAccessTokenExpiryMs() {
        return accessTokenExpiryMs;
    }

    // ── Internal ─────────────────────────────────────────────────

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes();
        // Pad or trim to exactly 32 bytes (256 bits) for HS256
        byte[] key256 = new byte[32];
        System.arraycopy(keyBytes, 0, key256, 0, Math.min(keyBytes.length, 32));
        return Keys.hmacShaKeyFor(key256);
    }
}
