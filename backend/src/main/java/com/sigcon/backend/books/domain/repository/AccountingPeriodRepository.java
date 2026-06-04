package com.sigcon.backend.books.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sigcon.backend.books.domain.model.AccountingPeriod;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.parametrization.companies.domain.model.Company;

public interface AccountingPeriodRepository extends JpaRepository<AccountingPeriod, Long>, JpaSpecificationExecutor<AccountingPeriod> {

    @Query("""
        SELECT ap
        FROM AccountingPeriod ap
        WHERE ap.company = :company
        AND ap.startDate = :startDate
        AND ap.deletedAt IS NULL
    """)
    Optional<AccountingPeriod> findByCompanyAndStartDate(@Param("company") Company company, @Param("startDate") LocalDate startDate);

    @Query("""
            SELECT ap
            FROM AccountingPeriod ap
            WHERE ap.company = :company
            AND ap.status = :status
            AND ap.deletedAt IS NULL
    """)
    Optional<AccountingPeriod> findAllByCompanyAndPeriodOpen(@Param("company") Company company, @Param("status") AccountingPeriodStatus status);

    @Query("""
        SELECT ap
        FROM AccountingPeriod ap
        WHERE ap.status = :status
        AND ap.endDate < :date
        AND ap.deletedAt IS NULL
    """)
    List<AccountingPeriod> findAllByStatusAndEndDateBefore(
        @Param("status") AccountingPeriodStatus status,
        @Param("date") LocalDate date
    );

    @Query("""
        SELECT ap
        FROM AccountingPeriod ap
        WHERE ap.company = :company
        AND ap.status = :status
        AND ap.deletedAt IS NULL
    """)
    Optional<AccountingPeriod> findByCompanyAndStatus(
        @Param("company") Company company,
        @Param("status") AccountingPeriodStatus status
    );
}
