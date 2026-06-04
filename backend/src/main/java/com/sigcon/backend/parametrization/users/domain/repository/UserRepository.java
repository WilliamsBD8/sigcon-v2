package com.sigcon.backend.parametrization.users.domain.repository;

import com.sigcon.backend.parametrization.users.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findAllByRoles_Name(String roleName);
    boolean existsByEmailAndDeletedAtIsNull(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);

    @Query(value = """
        SELECT COUNT(*) FROM users u
        WHERE u.deleted_at IS NULL
          AND (:companyId IS NULL OR u.company_id = :companyId)
    """, nativeQuery = true)
    Long countForDashboard(@Param("companyId") Long companyId);
}
