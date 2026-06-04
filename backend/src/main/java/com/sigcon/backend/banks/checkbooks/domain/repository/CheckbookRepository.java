package com.sigcon.backend.banks.checkbooks.domain.repository;

import com.sigcon.backend.banks.checkbooks.domain.model.Checkbook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface CheckbookRepository extends JpaRepository<Checkbook, Long>,
        JpaSpecificationExecutor<Checkbook> {

    boolean existsByBankAccount_IdAndCheckbookNumber(Long bankAccountId, String number);

    List<Checkbook> findByBankAccount_Id(Long bankAccountId);

    long countByBankAccount_Id(Long bankAccountId);

    Optional<Checkbook> findByIdOrCheckbookNumber(Long id, String number);
}