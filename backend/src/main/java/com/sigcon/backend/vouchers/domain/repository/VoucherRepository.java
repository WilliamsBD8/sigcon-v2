package com.sigcon.backend.vouchers.domain.repository;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sigcon.backend.banks.bankaccounts.domain.model.BankAccount;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;

public interface VoucherRepository extends JpaRepository<VouchersEntity, Long>, JpaSpecificationExecutor<VouchersEntity> {

    @Query(value = """
        SELECT MAX(v.number) FROM vouchers v 
        WHERE v.voucher_type_id = :voucherTypeId AND v.company_id = :companyId AND v.deleted_at IS NULL
    """, nativeQuery = true)
    BigInteger findTopByVoucherTypeIdAndCompanyIdOrderByNumberDesc(Long voucherTypeId, Long companyId);

    @Query(value = """
        SELECT v.* FROM vouchers v 
        WHERE v.asset_id = :assetId AND v.deleted_at IS NULL
    """, nativeQuery = true)
    List<VouchersEntity> findAllByAssetIdAndDeletedAtIsNull(Long assetId);

    @Query(value = """
        SELECT SUM(v.amount) FROM vouchers v 
        WHERE v.bank_account_id = :bankAccountId AND v.deleted_at IS NULL
    """, nativeQuery = true)
    BigDecimal sumVouchersByBankAccountId(Long bankAccountId);

    @Query(value = """
        SELECT SUM(v.amount) FROM vouchers v
        LEFT JOIN checks c ON c.id = v.check_id
        LEFT JOIN checkbooks cb ON cb.id = c.checkbooks_id
        WHERE c.id = :checkId AND v.deleted_at IS NULL
    """, nativeQuery = true)
    BigDecimal sumVouchersByCheckbookId(Long checkId);

    @Query("SELECT v FROM VouchersEntity v WHERE v.deletedAt IS NULL AND v.bankAccount.id = :bankAccountId "
            + "AND v.company.id = :companyId AND v.date >= :from AND v.date <= :to ORDER BY v.date DESC, v.id DESC")
    List<VouchersEntity> findReconciliationCandidates(
            @Param("bankAccountId") Long bankAccountId,
            @Param("companyId") Long companyId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query(value = """
            SELECT COALESCE(SUM(v.amount), 0) FROM vouchers v
            WHERE v.bank_account_id = :bankAccountId AND v.company_id = :companyId
            AND v.deleted_at IS NULL AND v.date <= :asOfDate
            """, nativeQuery = true)
    BigDecimal sumVoucherAmountsByBankAccountUpToDate(
            @Param("bankAccountId") Long bankAccountId,
            @Param("companyId") Long companyId,
            @Param("asOfDate") LocalDate asOfDate);


    @Query("""
        SELECT COALESCE(SUM(v.amount), 0)
        FROM VouchersEntity v
        WHERE v.invoice.id = :invoiceId
        AND v.deletedAt IS NULL
    """)
    BigDecimal sumVouchersByInvoiceId(Long invoiceId);

    @Query("""
        SELECT v FROM VouchersEntity v
        LEFT JOIN v.check c
        LEFT JOIN c.checkbook cb
        WHERE (
            v.bankAccount.id = :bankAccountId
            OR EXISTS (
                SELECT 1 FROM Check c
                JOIN c.checkbook cb
                WHERE c = v.check
                AND cb.bankAccount.id = :bankAccountId
            )    
        )
        AND v.diaryBook.generalLedger.accountingPeriod.status = :status
        AND v.deletedAt IS NULL
    """)
    List<VouchersEntity> findAllByBankAccountAndOpenPeriod(Long bankAccountId, AccountingPeriodStatus status);

    @Query("""
        SELECT v FROM VouchersEntity v
        WHERE v.diaryBook.generalLedger.accountingPeriod.status = :status
        AND v.deletedAt IS NULL
    """)
    List<VouchersEntity> findAllByOpenPeriod(AccountingPeriodStatus status);

    @Query(value = """
        SELECT COUNT(*) FROM vouchers v
        WHERE v.deleted_at IS NULL
          AND (:companyId IS NULL OR v.company_id = :companyId)
    """, nativeQuery = true)
    Long countForDashboard(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT COALESCE(SUM(v.amount), 0) FROM vouchers v
        WHERE v.deleted_at IS NULL
          AND (:companyId IS NULL OR v.company_id = :companyId)
    """, nativeQuery = true)
    BigDecimal sumAmountForDashboard(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT DATE_TRUNC('month', v.date) AS month_key, COALESCE(SUM(v.amount), 0) AS amount
        FROM vouchers v
        WHERE v.deleted_at IS NULL
          AND v.date >= :fromDate
          AND (:companyId IS NULL OR v.company_id = :companyId)
        GROUP BY DATE_TRUNC('month', v.date)
        ORDER BY month_key ASC
    """, nativeQuery = true)
    List<Object[]> monthlyAmountForDashboard(@Param("fromDate") LocalDate fromDate, @Param("companyId") Long companyId);

    @Query(value = """
        SELECT c.id, c.name, COALESCE(SUM(v.amount), 0) AS total
        FROM vouchers v
        INNER JOIN companies c ON c.id = v.company_id
        WHERE v.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY total DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> topCompaniesByAmount(@Param("limit") Integer limit);
}
