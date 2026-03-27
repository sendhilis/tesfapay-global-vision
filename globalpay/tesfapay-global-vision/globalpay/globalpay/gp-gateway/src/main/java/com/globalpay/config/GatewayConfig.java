package com.globalpay.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

import java.util.List;

@Configuration
public class GatewayConfig {

    /**
     * Rate limit by user (X-User-Id header set by JwtAuthFilter) or by IP for public endpoints.
     */
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            List<String> userIdHeader = exchange.getRequest().getHeaders().get("X-User-Id");
            if (userIdHeader != null && !userIdHeader.isEmpty()) {
                return Mono.just(userIdHeader.get(0));
            }
            // Fall back to IP address for unauthenticated requests
            String remoteAddr = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just(remoteAddr);
        };
    }

    /**
     * Global CORS — allows the Lovable frontend and mobile app to call the gateway.
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "https://tesfapay-global-vision.lovable.app",
                "https://globalpay.et",
                "capacitor://localhost"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
