package com.sigcon.backend.parametrization.companies.domain.repository;

import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.parametrization.companies.domain.model.CompanyStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface CompanyRepository extends JpaRepository<Company, Long>, JpaSpecificationExecutor<Company> {

    boolean existsByNitAndDvAndDeletedAtIsNull(String nit, String dv);

    boolean existsByNitAndDvAndIdNotAndDeletedAtIsNull(String nit, String dv, Long id);

    boolean existsByNameAndDeletedAtIsNull(String name);

    boolean existsByNameAndIdNotAndDeletedAtIsNull(String name, Long id);

    Optional<Company> findByNameAndDeletedAtIsNull(String name);

    List<Company> findAllByDeletedAtIsNullAndStatus(CompanyStatus status);

    @Query(value = """
        SELECT COUNT(*) FROM companies c
        WHERE c.deleted_at IS NULL
          AND c.status = 'ACTIVE'
    """, nativeQuery = true)
    Long countActiveForDashboard();
}

