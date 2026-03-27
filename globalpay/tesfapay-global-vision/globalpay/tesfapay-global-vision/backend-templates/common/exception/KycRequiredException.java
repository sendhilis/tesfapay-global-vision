package com.globalpay.common.exception;

public class KycRequiredException extends RuntimeException {
    public KycRequiredException(String message) { super(message); }
}
