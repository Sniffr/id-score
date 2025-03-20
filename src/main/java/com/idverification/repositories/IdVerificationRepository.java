package com.idverification.repositories;

import com.idverification.models.IdVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IdVerificationRepository extends JpaRepository<IdVerification, Long> {
    IdVerification findByIdNumber(String idNumber);
}
