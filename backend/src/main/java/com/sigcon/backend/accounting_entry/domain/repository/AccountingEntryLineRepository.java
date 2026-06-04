package com.sigcon.backend.accounting_entry.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import com.sigcon.backend.accounting_entry.domain.model.AccountingEntryLine;

import jakarta.transaction.Transactional;

public interface AccountingEntryLineRepository extends JpaRepository<AccountingEntryLine, Long>, JpaSpecificationExecutor<AccountingEntryLine> {

    List<AccountingEntryLine> findByAccountingEntry_IdOrderByIdAsc(Long accountingEntryId);

    @Transactional
    @Modifying
    @Query(value = """
        DELETE FROM accounting_entry_lines
        WHERE accounting_entry_id = :accountingEntryId
    """, nativeQuery = true)
    void hardDeleteByAccountingEntryId(@Param("accountingEntryId") Long accountingEntryId);

}
