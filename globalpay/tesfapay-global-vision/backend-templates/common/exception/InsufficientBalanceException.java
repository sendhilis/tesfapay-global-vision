package com.globalpay.common.exception;

// All custom exceptions — one file for convenience, split per-class if preferred.

public class InsufficientBalanceException extends RuntimeException {
    public InsufficientBalanceException(String message) { super(message); }
}

// ---

// package com.globalpay.common.exception;

// public class InvalidPinException extends RuntimeException {
//     public InvalidPinException(String message) { super(message); }
// }

// NOTE: Each class below should be in its own file in production.
// They are combined here for template brevity.
