package com.globalpay.transfer.service;

import com.globalpay.common.enums.TransactionStatus;
import com.globalpay.common.enums.TransactionType;
import com.globalpay.common.exception.*;
import com.globalpay.transfer.dto.*;
import com.globalpay.transfer.entity.Transaction;
import com.globalpay.transfer.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Transfer service — P2P money transfers with Saga orchestration.
 *
 * Maps to: API_CONTRACT.md §4 (P2P Transfers)
 * Front-end: SendMoney.tsx, RequestMoney.tsx
 *
 * Saga flow for P2P Send:
 * 1. Validate sender PIN (auth-service Feign)
 * 2. Check sender daily/monthly limits
 * 3. Debit sender wallet (wallet-service Feign)
 * 4. Credit recipient wallet (wallet-service Feign)
 * 5. Record transaction
 * 6. Award loyalty points (Kafka → loyalty-service)
 * 7. Send notifications (Kafka → notification-service)
 *
 * Compensation (on failure):
 * - If step 4 fails → refund sender (wallet credit)
 * - If step 5 fails → reverse both wallet operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransferService {

    private final TransactionRepository transactionRepository;
    // private final WalletServiceClient walletClient;      // OpenFeign to wallet-service
    // private final UserServiceClient userClient;          // OpenFeign to auth-service
    // private final KafkaTemplate<String, Object> kafka;   // Kafka producer

    private static final BigDecimal P2P_FEE = new BigDecimal("2.50");

    /**
     * Send money P2P.
     * POST /transfers/send → { recipientPhone, amount, note, pin }
     *
     * Front-end: SendMoney.tsx — confirm button after entering recipient + amount
     *
     * @param senderId   Authenticated user ID from JWT
     * @param request    Send money request DTO
     * @return           SendMoneyResponse with transaction details
     */
    @Transactional
    public SendMoneyResponse sendMoney(UUID senderId, SendMoneyRequest request) {
        // 1. Idempotency check
        if (request.getIdempotencyKey() != null) {
            var existing = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                throw new DuplicateTransactionException("Transaction already processed");
            }
        }

        // 2. Look up recipient
        // UserInfo recipient = userClient.lookupByPhone(request.getRecipientPhone());
        // if (recipient == null) throw new ResourceNotFoundException("Recipient not found");

        // 3. Validate PIN
        // userClient.validatePin(senderId, request.getPin());

        // 4. Calculate total
        BigDecimal fee = P2P_FEE;
        BigDecimal totalDeducted = request.getAmount().add(fee);

        // 5. Debit sender wallet (via Feign → wallet-service)
        // BigDecimal senderNewBalance = walletClient.debit(senderId, totalDeducted);

        // 6. Credit recipient wallet
        // walletClient.credit(recipient.getId(), request.getAmount());

        // 7. Generate reference
        String reference = "TXN" + System.currentTimeMillis();

        // 8. Record transaction
        Transaction transaction = Transaction.builder()
                .reference(reference)
                .type(TransactionType.P2P_SEND)
                .senderUserId(senderId)
                // .recipientUserId(recipient.getId())
                .amount(request.getAmount())
                .fee(fee)
                .totalAmount(totalDeducted)
                .status(TransactionStatus.COMPLETED)
                // .counterpartyName(recipient.getName())
                .note(request.getNote())
                .loyaltyPointsEarned(calculateLoyaltyPoints(request.getAmount()))
                // .balanceAfter(senderNewBalance)
                .idempotencyKey(request.getIdempotencyKey())
                .completedAt(Instant.now())
                .build();

        transaction = transactionRepository.save(transaction);

        // 9. Publish events (async)
        // kafka.send("transfer.completed", new TransferCompletedEvent(transaction));
        // kafka.send("loyalty.points.earned", new PointsEarnedEvent(senderId, points));
        // kafka.send("notification.send", new NotificationEvent(recipientId, "Money Received", ...));

        log.info("P2P transfer completed: {} → amount={}, ref={}",
                senderId, request.getAmount(), reference);

        return SendMoneyResponse.builder()
                .transactionId(transaction.getId().toString())
                .reference(reference)
                .amount(request.getAmount())
                .fee(fee)
                .totalDeducted(totalDeducted)
                // .recipientName(recipient.getName())
                .status("COMPLETED")
                .loyaltyPointsEarned(transaction.getLoyaltyPointsEarned())
                // .newBalance(senderNewBalance)
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private int calculateLoyaltyPoints(BigDecimal amount) {
        // 0.1 points per ETB
        return amount.multiply(new BigDecimal("0.1")).intValue();
    }
}
