package com.globalpay.service;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Generates human-readable, unique transaction reference numbers.
 *
 * Examples:
 *   TXN20241100001   – P2P transfer
 *   BIL20241100001   – Bill payment
 *   AIR20241100001   – Airtime top-up
 *   CI-20241100001   – Cash-in
 *   CO-20241100001   – Cash-out
 *   LNS20241100001   – Loan
 *   SVG20241100001   – Savings deposit
 *   REQ-20241100001  – Money request
 */
@Component
public class ReferenceGenerator {

    private final AtomicInteger sequence = new AtomicInteger(1);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    public String generate(String prefix) {
        String date = LocalDateTime.now().format(FMT);
        int seq = sequence.getAndIncrement();
        return String.format("%s%s%05d", prefix, date, seq);
    }

    public String forTransfer()          { return generate("TXN"); }
    public String forBillPayment()       { return generate("BIL"); }
    public String forAirtime()           { return generate("AIR"); }
    public String forMerchant()          { return generate("MRX"); }
    public String forCashIn()            { return generate("CI-"); }
    public String forCashOut()           { return generate("CO-"); }
    public String forLoan()              { return generate("LNS"); }
    public String forSavingsDeposit()    { return generate("SVG"); }
    public String forSavingsWithdraw()   { return generate("SVW"); }
    public String forMoneyRequest()      { return generate("REQ"); }
    public String forRewardRedemption()  { return generate("RWD"); }
    public String forReversal()          { return generate("REV"); }
}
