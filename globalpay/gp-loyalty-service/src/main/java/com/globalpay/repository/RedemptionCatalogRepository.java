package com.globalpay.repository;
import com.globalpay.model.entity.RedemptionCatalog;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface RedemptionCatalogRepository extends JpaRepository<RedemptionCatalog, UUID> { List<RedemptionCatalog> findByActiveTrue(); }
