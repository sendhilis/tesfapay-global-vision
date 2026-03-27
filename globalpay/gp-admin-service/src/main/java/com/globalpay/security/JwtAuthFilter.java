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
import java.io.IOException;
import java.util.List;
@Slf4j @Component public class JwtAuthFilter extends OncePerRequestFilter {
    @Value("${jwt.secret}") private String s;
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws jakarta.servlet.ServletException,IOException {
        try{String h=req.getHeader("Authorization");
        if(StringUtils.hasText(h)&&h.startsWith("Bearer ")){String t=h.substring(7);byte[] k=s.getBytes();byte[] k32=new byte[32];System.arraycopy(k,0,k32,0,Math.min(k.length,32));
        Claims c=Jwts.parser().verifyWith(Keys.hmacShaKeyFor(k32)).build().parseSignedClaims(t).getPayload();
        req.setAttribute("userId",c.getSubject());req.setAttribute("role",c.get("role",String.class));
        String role=c.get("role",String.class);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(c.getSubject(),null,List.of(new SimpleGrantedAuthority("ROLE_"+role))));}}catch(Exception e){log.warn("JWT: {}",e.getMessage());}chain.doFilter(req,res);
    }
}
