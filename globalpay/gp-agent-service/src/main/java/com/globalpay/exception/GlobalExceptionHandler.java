package com.globalpay.exception;
import com.globalpay.model.dto.response.ApiErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.Instant;
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler({InvalidOtpException.class, InvalidPinException.class})
    public ResponseEntity<ApiErrorResponse> badRequest(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.builder().status(400).message(ex.getMessage()).timestamp(Instant.now()).build());
    }
    @ExceptionHandler({AgentNotFoundException.class, CustomerNotFoundException.class})
    public ResponseEntity<ApiErrorResponse> notFound(RuntimeException ex) {
        return ResponseEntity.status(404).body(ApiErrorResponse.builder().status(404).message(ex.getMessage()).timestamp(Instant.now()).build());
    }
    @ExceptionHandler({InsufficientFloatException.class, AgentSuspendedException.class})
    public ResponseEntity<ApiErrorResponse> forbidden(RuntimeException ex) {
        return ResponseEntity.status(403).body(ApiErrorResponse.builder().status(403).message(ex.getMessage()).timestamp(Instant.now()).build());
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> general(Exception ex) {
        log.error("Unhandled: {}", ex.getMessage(), ex);
        return ResponseEntity.status(500).body(ApiErrorResponse.builder().status(500).message("Internal server error").timestamp(Instant.now()).build());
    }
}