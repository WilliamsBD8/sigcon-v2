package com.sigcon.backend.third_parties.third_parties.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sigcon.backend.third_parties.third_parties.domain.model.ThirdParty;

import java.util.List;
import java.util.Optional;

public interface ThirdPartyRepository extends JpaRepository<ThirdParty, Long>, JpaSpecificationExecutor<ThirdParty> {
    boolean existsByNitAndDvAndDeletedAtIsNull(String nit, String dv);

    boolean existsByNitAndDvAndIdNotAndDeletedAtIsNull(String nit, String dv, Long id);

    boolean existsByNitAndDeletedAtIsNull(String nit);

    List<ThirdParty> findByNitAndDeletedAtIsNull(String nit);

    Optional<ThirdParty> findByNitOrId(String nit, Long id);

    Optional<ThirdParty> findByIdAndDeletedAtIsNull(Long id);

    @Query("""
            SELECT DISTINCT tp FROM ThirdParty tp
            JOIN tp.roles r
            WHERE UPPER(r.name) = UPPER(:roleName)
            ORDER BY tp.businessName ASC
            """)
    List<ThirdParty> findAllActiveByRoleName(@Param("roleName") String roleName);
}
