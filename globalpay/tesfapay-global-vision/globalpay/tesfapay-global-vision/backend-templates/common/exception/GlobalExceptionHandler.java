package com.globalpay.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for all microservices.
 * Include this in each service's component scan or copy per-service.
 *
 * Maps to: API_CONTRACT.md §17 — Error Handling
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InsufficientBalanceException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientBalance(InsufficientBalanceException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "INSUFFICIENT_BALANCE", ex.getMessage());
    }

    @ExceptionHandler(InvalidPinException.class)
    public ResponseEntity<ErrorResponse> handleInvalidPin(InvalidPinException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "INVALID_PIN", ex.getMessage());
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", ex.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(DuplicateTransactionException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DuplicateTransactionException ex) {
        return buildResponse(HttpStatus.CONFLICT, "DUPLICATE_TRANSACTION", ex.getMessage());
    }

    @ExceptionHandler(DailyLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleDailyLimit(DailyLimitExceededException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "DAILY_LIMIT_EXCEEDED", ex.getMessage());
    }

    @ExceptionHandler(KycRequiredException.class)
    public ResponseEntity<ErrorResponse> handleKycRequired(KycRequiredException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "KYC_REQUIRED", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        ErrorResponse response = new ErrorResponse(
                Instant.now(), 400, "Bad Request", "VALIDATION_ERROR",
                "Validation failed", null
        );
        response.setFieldErrors(fieldErrors);
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred");
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String code, String message) {
        ErrorResponse error = new ErrorResponse(
                Instant.now(), status.value(), status.getReasonPhrase(),
                code, message, null
        );
        return ResponseEntity.status(status).body(error);
    }
}
