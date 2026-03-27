package com.globalpay.repository;

import com.globalpay.model.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository public interface BillerRepository extends JpaRepository<Biller, UUID> {
    List<Biller> findByCategoryAndActiveTrue(String category);
    List<Biller> findByActiveTrue();
}
