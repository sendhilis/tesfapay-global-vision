package com.globalpay.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean public NewTopic transferCompleted()    { return TopicBuilder.name("transfer.completed").partitions(3).replicas(1).build(); }
    @Bean public NewTopic paymentCompleted()     { return TopicBuilder.name("payment.completed").partitions(3).replicas(1).build(); }
    @Bean public NewTopic walletCredited()       { return TopicBuilder.name("wallet.credited").partitions(3).replicas(1).build(); }
    @Bean public NewTopic walletDebited()        { return TopicBuilder.name("wallet.debited").partitions(3).replicas(1).build(); }
    @Bean public NewTopic savingsDeposited()     { return TopicBuilder.name("savings.deposited").partitions(3).replicas(1).build(); }
    @Bean public NewTopic loanDisbursed()        { return TopicBuilder.name("loan.disbursed").partitions(3).replicas(1).build(); }
    @Bean public NewTopic agentCashin()          { return TopicBuilder.name("agent.cashin").partitions(3).replicas(1).build(); }
    @Bean public NewTopic agentCashout()         { return TopicBuilder.name("agent.cashout").partitions(3).replicas(1).build(); }
    @Bean public NewTopic auditEvent()           { return TopicBuilder.name("audit.event").partitions(3).replicas(1).build(); }
}
