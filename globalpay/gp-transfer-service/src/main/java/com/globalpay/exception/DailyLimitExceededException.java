package com.globalpay.exception;
public class DailyLimitExceededException extends RuntimeException { public DailyLimitExceededException(String m) { super(m); } }