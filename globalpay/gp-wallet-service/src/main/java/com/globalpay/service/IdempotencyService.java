package com.globalpay.service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.Optional;
/**
 * Redis-backed idempotency guard.
 * Prevents double-credit/double-debit from: retries, USSD re-submissions,
 * network timeouts causing duplicate requests, and concurrent identical calls.
 */
@Slf4j @Service @RequiredArgsConstructor
public class IdempotencyService {
    private final StringRedisTemplate redis;
    private static final Duration TTL = Duration.ofHours(24);
    private static final String PREFIX = "idempotency:";

    public Optional<String> getCachedResult(String key) {
        if (key == null || key.isBlank()) return Optional.empty();
        try {
            String val = redis.opsForValue().get(PREFIX + key);
            if (val != null) { log.warn("Duplicate request: key={}", key); return Optional.of(val); }
        } catch (Exception e) { log.error("Redis idempotency check failed: {}", e.getMessage()); }
        return Optional.empty();
    }

    public void storeResult(String key, String result) {
        if (key == null || key.isBlank()) return;
        try { redis.opsForValue().set(PREFIX + key, result, TTL); }
        catch (Exception e) { log.error("Redis store failed: {}", e.getMessage()); }
    }

    /** Distributed lock: prevents two identical requests processing simultaneously */
    public boolean tryLock(String key) {
        if (key == null || key.isBlank()) return true;
        try {
            Boolean ok = redis.opsForValue().setIfAbsent(PREFIX + "lock:" + key, "1", Duration.ofSeconds(30));
            return Boolean.TRUE.equals(ok);
        } catch (Exception e) { log.error("Redis lock failed: {}", e.getMessage()); return true; }
    }

    public void releaseLock(String key) {
        if (key == null || key.isBlank()) return;
        try { redis.delete(PREFIX + "lock:" + key); }
        catch (Exception e) { log.error("Redis unlock failed: {}", e.getMessage()); }
    }
}