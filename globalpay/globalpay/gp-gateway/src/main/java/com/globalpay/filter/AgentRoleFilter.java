package com.globalpay.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

/**
 * Checks that the X-User-Role header (set by JwtAuthFilter) contains an
 * AGENT or SUPER_AGENT role before forwarding to the agent portal.
 */
@Slf4j
@Component
public class AgentRoleFilter extends AbstractGatewayFilterFactory<AgentRoleFilter.Config> {

    private static final Set<String> AGENT_ROLES = Set.of("AGENT", "SUPER_AGENT", "ADMIN");

    public AgentRoleFilter() { super(Config.class); }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String role = getRoleHeader(exchange);
            if (role == null || !AGENT_ROLES.contains(role.toUpperCase())) {
                return forbidden(exchange, "Agent role required");
            }
            return chain.filter(exchange);
        };
    }

    private String getRoleHeader(ServerWebExchange ex) {
        List<String> headers = ex.getRequest().getHeaders().get("X-User-Role");
        return (headers != null && !headers.isEmpty()) ? headers.get(0) : null;
    }

    private Mono<Void> forbidden(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = String.format(
                "{\"status\":403,\"error\":\"Forbidden\",\"code\":\"ACCESS_DENIED\",\"message\":\"%s\"}", message);
        var buffer = exchange.getResponse().bufferFactory().wrap(body.getBytes());
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    public static class Config {}
}
