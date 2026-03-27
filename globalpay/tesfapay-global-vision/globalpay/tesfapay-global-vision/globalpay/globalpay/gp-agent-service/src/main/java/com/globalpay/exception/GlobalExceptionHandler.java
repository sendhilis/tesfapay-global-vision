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
class AgentNotFoundException extends RuntimeException {
    public AgentNotFoundException(String m) { super(m); }
}
class InsufficientFloatException extends RuntimeException {
    public InsufficientFloatException(String m) { super(m); }
}
class InvalidOtpException extends RuntimeException {
    public InvalidOtpException(String m) { super(m); }
}
class InvalidPinException extends RuntimeException {
    public InvalidPinException(String m) { super(m); }
}
class CustomerNotFoundException extends RuntimeException {
    public CustomerNotFoundException(String m) { super(m); }
}
class AgentSuspendedException extends RuntimeException {
    public AgentSuspendedException(String m) { super(m); }
}

// ── Handler ──────────────────────────────────────────────────────
@Slf4j @RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AgentNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> agentNotFound(AgentNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "AGENT_NOT_FOUND", ex.getMessage(), req.getRequestURI());
    }
    @ExceptionHandler(InsufficientFloatException.class)
    public ResponseEntity<ApiErrorResponse> insufficientFloat(InsufficientFloatException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "AGENT_FLOAT_LOW", ex.getMessage(), req.getRequestURI());
    }
    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ApiErrorResponse> invalidOtp(InvalidOtpException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_OTP", ex.getMessage(), req.getRequestURI());
    }
    @ExceptionHandler(InvalidPinException.class)
    public ResponseEntity<ApiErrorResponse> invalidPin(InvalidPinException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "INVALID_PIN", ex.getMessage(), req.getRequestURI());
    }
    @ExceptionHandler(CustomerNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> customerNotFound(CustomerNotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "CUSTOMER_NOT_FOUND", ex.getMessage(), req.getRequestURI());
    }
    @ExceptionHandler(AgentSuspendedException.class)
    public ResponseEntity<ApiErrorResponse> suspended(AgentSuspendedException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "AGENT_SUSPENDED", ex.getMessage(), req.getRequestURI());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> validation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid"));
        return ResponseEntity.badRequest().body(ApiErrorResponse.builder()
                .timestamp(Instant.now()).status(400).error("Bad Request")
                .code("VALIDATION_ERROR").message("Validation failed")
                .path(req.getRequestURI()).fieldErrors(errors).build());
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> all(Exception ex, HttpServletRequest req) {
        log.error("Unhandled: {}", ex.getMessage(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unexpected error", req.getRequestURI());
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus s, String code, String msg, String path) {
        return ResponseEntity.status(s).body(ApiErrorResponse.builder()
                .timestamp(Instant.now()).status(s.value()).error(s.getReasonPhrase())
                .code(code).message(msg).path(path).build());
    }
}
