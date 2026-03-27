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
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            String token = extractToken(request);
            if (StringUtils.hasText(token)) {
                Claims claims = parseClaims(token);
                String userId   = claims.getSubject();
                String role     = claims.get("role", String.class);
                String walletId = claims.get("walletId", String.class);
                String phone    = claims.get("phone", String.class);

                request.setAttribute("userId",   userId);
                request.setAttribute("walletId", walletId);
                request.setAttribute("phone",    phone);
                request.setAttribute("role",     role);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userId, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ex) {
            log.warn("JWT filter error: {}", ex.getMessage());
        }
        chain.doFilter(request, response);
    }

    private Claims parseClaims(String token) {
        byte[] keyBytes = jwtSecret.getBytes();
        byte[] key256 = new byte[32];
        System.arraycopy(keyBytes, 0, key256, 0, Math.min(keyBytes.length, 32));
        SecretKey key = Keys.hmacShaKeyFor(key256);
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    private String extractToken(HttpServletRequest req) {
        String header = req.getHeader("Authorization");
        return (StringUtils.hasText(header) && header.startsWith("Bearer ")) ? header.substring(7) : null;
    }
}
