package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface TelecomOperatorRepository extends JpaRepository<TelecomOperator, UUID> { List<TelecomOperator> findByActiveTrue(); }
