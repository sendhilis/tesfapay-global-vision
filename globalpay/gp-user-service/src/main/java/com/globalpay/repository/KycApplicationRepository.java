package com.globalpay.repository;

import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

public interface KycApplicationRepository extends JpaRepository<KycApplication, UUID> {
    List<KycApplication> findByUserIdOrderBySubmittedAtDesc(UUID userId);
    Page<KycApplication> findByStatusOrderBySubmittedAtAsc(String status, Pageable pageable);
    Optional<KycApplication> findTopByUserIdOrderBySubmittedAtDesc(UUID userId);
}
