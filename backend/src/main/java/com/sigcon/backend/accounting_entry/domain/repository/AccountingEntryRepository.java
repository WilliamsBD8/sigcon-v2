package com.sigcon.backend.accounting_entry.domain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sigcon.backend.accounting_entry.domain.model.AccountingEntry;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;

import jakarta.transaction.Transactional;

public interface AccountingEntryRepository extends JpaRepository<AccountingEntry, Long>, JpaSpecificationExecutor<AccountingEntry> {
    
    @Query("""
        SELECT MAX(a.consecutive)
        FROM AccountingEntry a
        WHERE a.company = :company
        AND a.deletedAt IS NULL
    """)
    Optional<Integer> findMaxConsecutiveByCompany(@Param("company") Company company);

    @Query("""
        SELECT a
        FROM AccountingEntry a
        WHERE a.voucher = :voucher
    """)
    Optional<AccountingEntry> findByVoucher(@Param("voucher") VouchersEntity voucher);
}
