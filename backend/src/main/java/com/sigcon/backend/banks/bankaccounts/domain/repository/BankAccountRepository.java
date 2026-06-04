package com.sigcon.backend.banks.bankaccounts.domain.repository;

import com.sigcon.backend.banks.bankaccounts.domain.model.BankAccount;
import com.sigcon.backend.parametrization.companies.domain.model.Company;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long>, JpaSpecificationExecutor<BankAccount> {

    boolean existsByCompanyIdAndCodeAndDeletedAtIsNull(Long companyId, String code);

    boolean existsByCompanyIdAndCodeAndIdNotAndDeletedAtIsNull(Long companyId, String code, Long excludeId);

    boolean existsByBankIdAndAccountNumberAndDeletedAtIsNull(Long bankId, String accountNumber);

    boolean existsByBankIdAndAccountNumberAndIdNotAndDeletedAtIsNull(Long bankId, String accountNumber, Long excludeId);

    Optional<BankAccount> findByIdAndDeletedAtIsNull(Long id);

    @Query(value = """
        SELECT COUNT(*) FROM bank_accounts b
        WHERE b.deleted_at IS NULL
          AND (:companyId IS NULL OR b.company_id = :companyId)
    """, nativeQuery = true)
    Long countForDashboard(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT COALESCE(SUM(b.current_balance), 0) FROM bank_accounts b
        WHERE b.deleted_at IS NULL
          AND (:companyId IS NULL OR b.company_id = :companyId)
    """, nativeQuery = true)
    BigDecimal sumCurrentBalanceForDashboard(@Param("companyId") Long companyId);

    List<BankAccount> findAllByCompany(Company company);

    Optional<BankAccount> findByAccountNumber(String accountNumber);
    Optional<BankAccount> findByIdOrAccountNumber(Long id, String accountNumber);

}
