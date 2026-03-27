package com.globalpay.common.exception;

public class DuplicateTransactionException extends RuntimeException {
    public DuplicateTransactionException(String message) { super(message); }
}
