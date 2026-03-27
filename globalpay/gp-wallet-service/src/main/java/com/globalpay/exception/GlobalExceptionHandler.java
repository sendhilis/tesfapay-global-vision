package com.globalpay.exception;

import com.globalpay.model.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InsufficientBalanceException.class)
    public ResponseEntity<ApiErrorResponse> handleInsufficient(InsufficientBalanceException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "INSUFFICIENT_BALANCE", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(WalletNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(WalletNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "WALLET_NOT_FOUND", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(DuplicateTransactionException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateTransactionException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "DUPLICATE_TRANSACTION", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(WalletLockedException.class)
    public ResponseEntity<ApiErrorResponse> handleLocked(WalletLockedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "WALLET_LOCKED", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid"));
        ApiErrorResponse body = ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(400)
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
        log.error("Unhandled error at {}: {}", req.getRequestURI(), ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", req.getRequestURI());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message, String path) {
        return ResponseEntity.status(status).body(ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .code(code)
                .message(message)
                .path(path)
                .build());
    }
}
