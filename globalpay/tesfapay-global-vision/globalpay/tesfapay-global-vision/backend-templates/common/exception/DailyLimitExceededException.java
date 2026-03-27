package com.globalpay.common.exception;

public class DailyLimitExceededException extends RuntimeException {
    public DailyLimitExceededException(String message) { super(message); }
}
