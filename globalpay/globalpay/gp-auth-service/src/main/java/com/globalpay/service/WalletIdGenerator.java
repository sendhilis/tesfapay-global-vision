package com.globalpay.service;

import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class WalletIdGenerator {

    private final AtomicInteger sequence = new AtomicInteger(1);

    public String generate(String firstName) {
        int year = LocalDate.now().getYear();
        String namePart = firstName.toUpperCase().replaceAll("[^A-Z]", "");
        if (namePart.length() > 5) namePart = namePart.substring(0, 5);
        int seq = sequence.getAndIncrement();
        return String.format("TPY-%d-%s%03d", year, namePart, seq);
    }
}
