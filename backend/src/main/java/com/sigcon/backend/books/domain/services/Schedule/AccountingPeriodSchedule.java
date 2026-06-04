package com.sigcon.backend.books.domain.services.Schedule;

import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.sigcon.backend.books.domain.services.AccountingPeriodService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AccountingPeriodSchedule {

    private final AccountingPeriodService accountingPeriodService;

    /** Cierra periodos vencidos (endDate anterior a hoy) de todas las empresas activas. */
    @Scheduled(cron = "10 0 0 1 * *")
    public void closeExpiredAccountingPeriods() {
        accountingPeriodService.closeExpiredAccountingPeriodsForAllCompanies();
    }

    /** Crea el nuevo periodo cuando hoy es el primer dia de un periodo fiscal. */
    @Scheduled(cron = "0 0 0 1 * *")
    public void createAccountingPeriods() {

        System.out.println("Creando periodos fiscales");

        accountingPeriodService.createAccountingPeriodsForAllActiveCompanies();
    }
}
