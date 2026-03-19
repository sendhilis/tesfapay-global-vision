package com.globalpay.common.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Standard error response — matches API_CONTRACT.md §17.
 *
 * Example JSON:
 * {
 *   "timestamp": "2026-03-19T10:22:00Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "code": "INSUFFICIENT_BALANCE",
 *   "message": "Insufficient wallet balance for this transaction",
 *   "path": "/v1/transfers/send"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    private Instant timestamp;
    private int status;
    private String error;
    private String code;
    private String message;
    private String path;
    private Map<String, String> fieldErrors;

    public ErrorResponse(Instant timestamp, int status, String error, String code, String message, String path) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.code = code;
        this.message = message;
        this.path = path;
    }
}
