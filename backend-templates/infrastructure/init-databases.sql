-- GlobalPay — Database Initialization Script
-- Creates separate databases for each microservice (database-per-service pattern)
-- Run automatically by Docker Compose on first start

CREATE DATABASE globalpay_auth;
CREATE DATABASE globalpay_wallet;
CREATE DATABASE globalpay_transfer;
CREATE DATABASE globalpay_payment;
CREATE DATABASE globalpay_savings;
CREATE DATABASE globalpay_loan;
CREATE DATABASE globalpay_loyalty;
CREATE DATABASE globalpay_agent;
CREATE DATABASE globalpay_notification;
CREATE DATABASE globalpay_admin;
