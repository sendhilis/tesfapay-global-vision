-- V1__create_notification_tables.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE notifications (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL,
    type       VARCHAR(20)  NOT NULL,  -- TRANSACTION|SECURITY|PROMOTION|KYC|LOAN|SYSTEM
    title      VARCHAR(200) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    metadata   JSONB,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user       ON notifications(user_id);
CREATE INDEX idx_notif_unread     ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created    ON notifications(created_at DESC);
