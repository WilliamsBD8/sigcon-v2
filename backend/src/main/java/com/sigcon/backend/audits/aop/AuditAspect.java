package com.sigcon.backend.audits.aop;

import java.sql.PreparedStatement;

import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import com.sigcon.backend.utils.UserUtil;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Aspect
@Component
public class AuditAspect {

    @PersistenceContext
    private EntityManager entityManager;

    private final UserUtil userUtil;

    public AuditAspect(UserUtil userUtil) {
        this.userUtil = userUtil;
    }

    @Around("@annotation(org.springframework.transaction.annotation.Transactional)")
    public Object setAuditUser(org.aspectj.lang.ProceedingJoinPoint joinPoint) throws Throwable {

        Long userId = getCurrentUserId();

        if (userId != null) {

            Session session = entityManager.unwrap(Session.class);

            session.doWork(connection -> {
                try (PreparedStatement ps = connection.prepareStatement(
                        "SELECT set_config('my.user_id', ?, true)")) {

                    ps.setString(1, userId.toString());
                    ps.execute();
                }
            });
        }

        return joinPoint.proceed();
    }

    private Long getCurrentUserId() {
        if (userUtil.getUser() == null) {
            return null;
        }
        return userUtil.getUser().getId();
    }
}
