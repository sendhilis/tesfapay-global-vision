package com.globalpay.exception;

import com.globalpay.model.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleUserExists(UserAlreadyExistsException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "DUPLICATE_USER", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(InvalidPinException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidPin(InvalidPinException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_PIN", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiErrorResponse> handleLocked(AccountLockedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidOtp(InvalidOtpException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_OTP", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ApiErrorResponse> handleTokenRefresh(TokenRefreshException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotFound(UsernameNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCreds(BadCredentialsException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid phone or PIN", req.getRequestURI());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have permission", req.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"));

        ApiErrorResponse body = ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request")
                .code("VALIDATION_ERROR")
                .message("Request validation failed")
                .path(req.getRequestURI())
                .fieldErrors(errors)
                .build();

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAll(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception at {}: {}", req.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", req.getRequestURI());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message, String path) {
        return ResponseEntity.status(status).body(
                ApiErrorResponse.builder()
                        .timestamp(Instant.now())
                        .status(status.value())
                        .error(status.getReasonPhrase())
                        .code(code)
                        .message(message)
                        .path(path)
                        .build()
        );
    }
}
