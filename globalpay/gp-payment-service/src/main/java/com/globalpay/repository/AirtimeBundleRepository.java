package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface AirtimeBundleRepository extends JpaRepository<AirtimeBundle, UUID> {
    List<AirtimeBundle> findByOperatorIdAndActiveTrueOrderBySortOrderAsc(UUID operatorId);
}
