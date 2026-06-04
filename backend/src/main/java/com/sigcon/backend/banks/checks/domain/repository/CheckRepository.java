package com.sigcon.backend.banks.checks.domain.repository;

import com.sigcon.backend.banks.checkbooks.domain.model.Checkbook;
import com.sigcon.backend.banks.checks.domain.model.Check;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CheckRepository extends JpaRepository<Check, Long>, JpaSpecificationExecutor<Check> {

    @Query("SELECT COUNT(c) > 0 FROM Check c WHERE c.numberCheck = :numberCheck AND c.checkbook.id = :checkbookId AND c.deletedAt IS NULL")
    boolean existsByNumberCheck(Integer numberCheck, Long checkbookId);

    boolean existsByNumberCheckAndDeletedAtIsNull(Integer numberCheck);

    Optional<Check> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT c FROM Check c WHERE c.numberCheck = :numberCheck AND c.checkbook = :checkbook AND c.deletedAt IS NULL")
    Optional<Check> findByNumberCheckAndChecbook(Integer numberCheck, Checkbook checkbook);

    @EntityGraph(attributePaths = {"checkbook", "checkbook.bankAccount"})
    @Query("SELECT c FROM Check c WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Check> findWithCheckbookAndBankById(@Param("id") Long id);

    long countByCheckbook_Id(Long checkbookId);

    Optional<Check> findByIdOrNumberCheck(Long id, Integer numberCheck);
}
