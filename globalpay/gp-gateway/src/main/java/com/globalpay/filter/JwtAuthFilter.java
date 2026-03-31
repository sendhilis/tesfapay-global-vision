package com.globalpay.filter;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private static final String[] PUBLIC_PATHS = {
        "/auth/", "/actuator/", "/discovery/"
    };

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        for (String pub : PUBLIC_PATHS) {
            if (path.startsWith(pub)) return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            String token = authHeader.substring(7);
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtSecret.getBytes())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Integer kycLevel = claims.get("kycLevel", Integer.class);
            int kycLevelInt = kycLevel != null ? kycLevel : 1;

            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header("X-User-Id",    claims.getSubject())
                    .header("X-User-Role",  getOrEmpty(claims, "role"))
                    .header("X-Wallet-Id",  getOrEmpty(claims, "walletId"))
                    .header("X-User-Phone", getOrEmpty(claims, "phone"))
                    .header("X-Kyc-Level",  String.valueOf(kycLevelInt))
                    .build();

            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private String getOrEmpty(Claims claims, String key) {
        Object val = claims.get(key);
        return val != null ? val.toString() : "";
    }

    @Override
    public int getOrder() { return -1; }
}