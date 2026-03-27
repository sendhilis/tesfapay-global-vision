package com.globalpay.repository;

import com.globalpay.model.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {
    List<Contact> findByOwnerUserIdOrderByFavoriteDescContactNameAsc(UUID ownerId);
    Optional<Contact> findByOwnerUserIdAndContactPhone(UUID ownerId, String phone);
}
