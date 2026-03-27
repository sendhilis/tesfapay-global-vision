package com.globalpay.filter;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.List;

/**
 * Validates the Bearer JWT on each incoming request.
 * On success, injects X-User-Id, X-User-Role, X-Wallet-Id headers
 * so downstream microservices can trust the user identity without re-parsing the JWT.
 */
@Slf4j
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String token = extractToken(exchange);

            if (token == null) {
                return unauthorized(exchange, "Missing or malformed Authorization header");
            }

            try {
                Claims claims = parseClaims(token);

                // Forward identity as trusted headers to downstream services
                ServerWebExchange mutated = exchange.mutate()
                        .request(r -> r
                                .header("X-User-Id",    claims.getSubject())
                                .header("X-User-Role",  getOrEmpty(claims, "role"))
                                .header("X-Wallet-Id",  getOrEmpty(claims, "walletId"))
                                .header("X-User-Phone", getOrEmpty(claims, "phone"))
                                .header("X-Kyc-Level",  String.valueOf(
                                        claims.get("kycLevel", Integer.class) != null
                                                ? claims.get("kycLevel", Integer.class) : 1))
                        ).build();

                return chain.filter(mutated);

            } catch (ExpiredJwtException e) {
                return unauthorized(exchange, "Token expired");
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
                return unauthorized(exchange, "Invalid token");
            }
        };
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String extractToken(ServerWebExchange exchange) {
        List<String> headers = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (headers == null || headers.isEmpty()) return null;
        String header = headers.get(0);
        return (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;
    }

    private SecretKey signingKey() {
        byte[] key = jwtSecret.getBytes();
        byte[] k32 = new byte[32];
        System.arraycopy(key, 0, k32, 0, Math.min(key.length, 32));
        return Keys.hmacShaKeyFor(k32);
    }

    private String getOrEmpty(Claims claims, String key) {
        Object val = claims.get(key);
        return val != null ? val.toString() : "";
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format(
                "{\"status\":401,\"error\":\"Unauthorized\",\"code\":\"TOKEN_INVALID\",\"message\":\"%s\"}",
                message);
        var buffer = exchange.getResponse().bufferFactory().wrap(body.getBytes());
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    public static class Config {
        // No config needed — reads JWT secret from @Value
    }
}
