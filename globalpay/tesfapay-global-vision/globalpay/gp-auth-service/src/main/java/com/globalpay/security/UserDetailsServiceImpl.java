package com.globalpay.security;

import com.globalpay.model.entity.User;
import com.globalpay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + phone));

        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getRole().name()))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getPhone())
                .password(user.getPinHash())
                .authorities(authorities)
                .accountExpired(false)
                .credentialsExpired(false)
                .accountLocked(user.isLocked())
                .disabled(!"ACTIVE".equals(user.getStatus()) && !"PENDING_KYC".equals(user.getStatus()))
                .build();
    }
}
