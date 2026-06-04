package com.sigcon.backend.books.domain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sigcon.backend.books.domain.model.GeneralLedger;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.parametrization.companies.domain.model.Company;

public interface GeneralLedgerRepository extends JpaRepository<GeneralLedger, Long>, JpaSpecificationExecutor<GeneralLedger> {

    @Query("""
        SELECT gl
        FROM GeneralLedger gl
        WHERE gl.accountingPeriod.company = :company
        AND gl.deletedAt IS NULL
        ORDER BY gl.createdAt DESC
        LIMIT 1
    """)
    Optional<GeneralLedger> findLastByCompany(@Param("company") Company company);

    @Query("""
        SELECT gl
        FROM GeneralLedger gl
        WHERE gl.accountingPeriod.status = :status
        AND gl.deletedAt IS NULL
    """)
    Optional<GeneralLedger> findByStatus(@Param("status") AccountingPeriodStatus status);
}
