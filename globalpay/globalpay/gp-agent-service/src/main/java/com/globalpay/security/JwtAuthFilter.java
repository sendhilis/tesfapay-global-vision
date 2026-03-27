package com.globalpay.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.util.List;

@Slf4j
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            String token = extractToken(request);
            if (StringUtils.hasText(token)) {
                Claims claims = parse(token);
                request.setAttribute("userId",   claims.getSubject());
                request.setAttribute("walletId", claims.get("walletId", String.class));
                request.setAttribute("phone",    claims.get("phone",    String.class));
                request.setAttribute("role",     claims.get("role",     String.class));

                String role = claims.get("role", String.class);
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                claims.getSubject(), null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role))));
            }
        } catch (Exception ex) { log.warn("JWT error: {}", ex.getMessage()); }
        chain.doFilter(request, response);
    }

    private Claims parse(String token) {
        byte[] key = jwtSecret.getBytes();
        byte[] k32 = new byte[32];
        System.arraycopy(key, 0, k32, 0, Math.min(key.length, 32));
        SecretKey sk = Keys.hmacShaKeyFor(k32);
        return Jwts.parser().verifyWith(sk).build().parseSignedClaims(token).getPayload();
    }

    private String extractToken(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        return (StringUtils.hasText(h) && h.startsWith("Bearer ")) ? h.substring(7) : null;
    }
}
