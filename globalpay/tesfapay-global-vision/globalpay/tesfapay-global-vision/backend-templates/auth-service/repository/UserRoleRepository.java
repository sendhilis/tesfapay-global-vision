package com.globalpay.auth.repository;

import com.globalpay.auth.entity.UserRole;
import com.globalpay.common.enums.AppRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    List<UserRole> findByUserId(UUID userId);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
           "FROM UserRole r WHERE r.userId = :userId AND r.role = :role")
    boolean hasRole(UUID userId, AppRole role);
}
