package com.globalpay.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class AdminRoleFilter extends AbstractGatewayFilterFactory<AdminRoleFilter.Config> {

    public AdminRoleFilter() { super(Config.class); }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            List<String> roleHeader = exchange.getRequest().getHeaders().get("X-User-Role");
            String role = (roleHeader != null && !roleHeader.isEmpty()) ? roleHeader.get(0) : "";
            if (!"ADMIN".equalsIgnoreCase(role) && !"SUPER_ADMIN".equalsIgnoreCase(role)) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                String body = "{\"status\":403,\"error\":\"Forbidden\",\"code\":\"ADMIN_REQUIRED\",\"message\":\"Admin role required\"}";
                var buf = exchange.getResponse().bufferFactory().wrap(body.getBytes());
                return exchange.getResponse().writeWith(Mono.just(buf));
            }
            return chain.filter(exchange);
        };
    }

    public static class Config {}
}
