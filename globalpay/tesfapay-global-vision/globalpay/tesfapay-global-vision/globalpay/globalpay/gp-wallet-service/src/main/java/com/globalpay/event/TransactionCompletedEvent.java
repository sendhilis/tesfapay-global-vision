package com.globalpay.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TransactionCompletedEvent {
    private UUID       eventId;
    private UUID       transactionId;
    private String     reference;
    private String     type;
    private UUID       senderId;
    private String     senderWalletId;
    private UUID       recipientId;
    private String     recipientWalletId;
    private BigDecimal amount;
    private BigDecimal fee;
    private String     currency;
    private String     counterpartyName;
    private String     note;
    private Instant    timestamp;
}
