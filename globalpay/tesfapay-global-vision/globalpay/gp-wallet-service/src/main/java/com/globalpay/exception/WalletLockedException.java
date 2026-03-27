package com.globalpay.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class WalletLockedException extends RuntimeException {
    public WalletLockedException(String message) { super(message); }
}
