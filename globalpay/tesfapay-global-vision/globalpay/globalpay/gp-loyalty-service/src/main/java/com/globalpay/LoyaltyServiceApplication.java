package com.globalpay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication @EnableDiscoveryClient @EnableKafka
public class LoyaltyServiceApplication {
    public static void main(String[] args) { SpringApplication.run(LoyaltyServiceApplication.class, args); }
}
