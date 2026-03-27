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

// ── Custom exceptions ────────────────────────────────────────────

class RecipientNotFoundException extends RuntimeException {
    public RecipientNotFoundException(String m) { super(m); }
}

class DailyLimitExceededException extends RuntimeException {
    public DailyLimitExceededException(String m) { super(m); }
}

class DuplicateTransactionException extends RuntimeException {
    public DuplicateTransactionException(String m) { super(m); }
}

class InvalidPinException extends RuntimeException {
    public InvalidPinException(String m) { super(m); }
}

class MoneyRequestNotFoundException extends RuntimeException {
    public MoneyRequestNotFoundException(String m) { super(m); }
}

// ── Global handler ───────────────────────────────────────────────

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecipientNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleRecipientNotFound(RecipientNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "RECIPIENT_NOT_FOUND", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(DailyLimitExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleDailyLimit(DailyLimitExceededException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "DAILY_LIMIT_EXCEEDED", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(DuplicateTransactionException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateTransactionException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "DUPLICATE_TRANSACTION", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(InvalidPinException.class)
    public ResponseEntity<ApiErrorResponse> handlePin(InvalidPinException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_PIN", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(MoneyRequestNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleMReq(MoneyRequestNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "REQUEST_NOT_FOUND", ex.getMessage(), req.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid"));
        return ResponseEntity.badRequest().body(ApiErrorResponse.builder()
                .timestamp(Instant.now()).status(400).error("Bad Request")
                .code("VALIDATION_ERROR").message("Validation failed")
                .path(req.getRequestURI()).fieldErrors(errors).build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleAll(Exception ex, HttpServletRequest req) {
        log.error("Unhandled: {}", ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", req.getRequestURI());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message, String path) {
        return ResponseEntity.status(status).body(ApiErrorResponse.builder()
                .timestamp(Instant.now()).status(status.value())
                .error(status.getReasonPhrase()).code(code)
                .message(message).path(path).build());
    }
}
