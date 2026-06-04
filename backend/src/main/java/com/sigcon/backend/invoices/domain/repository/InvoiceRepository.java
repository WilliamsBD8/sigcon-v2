package com.sigcon.backend.invoices.domain.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;

import com.sigcon.backend.invoices.domain.model.Invoices;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoices, Long>, JpaSpecificationExecutor<Invoices> {

    // @Query("SELECT i FROM invoices i WHERE i.type_nvoice.id = :typeInvoiceId AND i.company.id = :companyId")
    Invoices findTopByTypeInvoiceIdAndCompanyIdOrderByIdDesc(Long typeInvoiceId, Long companyId);

    @Query(value = """
        SELECT COUNT(*) FROM invoices i
        WHERE i.deleted_at IS NULL
          AND (:companyId IS NULL OR i.company_id = :companyId)
    """, nativeQuery = true)
    Long countForDashboard(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT COALESCE(SUM(i.total_payment), 0) FROM invoices i
        WHERE i.deleted_at IS NULL
          AND (:companyId IS NULL OR i.company_id = :companyId)
    """, nativeQuery = true)
    BigDecimal sumTotalPaymentForDashboard(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT DATE_TRUNC('month', i.invoice_date) AS month_key,
               COALESCE(SUM(i.total_payment), 0) AS amount
        FROM invoices i
        WHERE i.deleted_at IS NULL
          AND i.invoice_date >= :fromDate
          AND (:companyId IS NULL OR i.company_id = :companyId)
        GROUP BY DATE_TRUNC('month', i.invoice_date)
        ORDER BY month_key ASC
    """, nativeQuery = true)
    List<Object[]> monthlyAmountForDashboard(@Param("fromDate") LocalDate fromDate, @Param("companyId") Long companyId);

    @Query(value = """
        SELECT c.id, c.name, COALESCE(SUM(i.total_payment), 0) AS total
        FROM invoices i
        INNER JOIN companies c ON c.id = i.company_id
        WHERE i.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY total DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> topCompaniesByTotalPayment(@Param("limit") Integer limit);
}
