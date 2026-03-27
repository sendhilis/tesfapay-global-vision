package com.globalpay.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * JWT Token Provider — generates and validates JWT access/refresh tokens.
 *
 * Maps to: API_CONTRACT.md §1 (Authentication)
 * Used by: auth-service (generation), all services (validation via gateway)
 *
 * Dependencies (add to pom.xml):
 *   <dependency>
 *     <groupId>io.jsonwebtoken</groupId>
 *     <artifactId>jjwt-api</artifactId>
 *     <version>0.12.5</version>
 *   </dependency>
 *   <dependency>
 *     <groupId>io.jsonwebtoken</groupId>
 *     <artifactId>jjwt-impl</artifactId>
 *     <version>0.12.5</version>
 *     <scope>runtime</scope>
 *   </dependency>
 *   <dependency>
 *     <groupId>io.jsonwebtoken</groupId>
 *     <artifactId>jjwt-jackson</artifactId>
 *     <version>0.12.5</version>
 *     <scope>runtime</scope>
 *   </dependency>
 */
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiry-ms:900000}")  // 15 minutes
    private long accessTokenExpiryMs;

    @Value("${jwt.refresh-token-expiry-ms:604800000}")  // 7 days
    private long refreshTokenExpiryMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate access token with user claims.
     * Claims include: userId, walletId, role, kycLevel
     */
    public String generateAccessToken(UUID userId, String walletId, String role, int kycLevel) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of(
                        "walletId", walletId,
                        "role", role,
                        "kycLevel", kycLevel
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpiryMs)))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generate refresh token (longer-lived, minimal claims).
     */
    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshTokenExpiryMs)))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validate and parse a JWT token.
     * Returns claims if valid, throws JwtException if invalid/expired.
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extract user ID from token.
     */
    public UUID getUserIdFromToken(String token) {
        Claims claims = validateToken(token);
        return UUID.fromString(claims.getSubject());
    }

    /**
     * Extract role from token.
     */
    public String getRoleFromToken(String token) {
        Claims claims = validateToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Check if token is expired.
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = validateToken(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }
}
