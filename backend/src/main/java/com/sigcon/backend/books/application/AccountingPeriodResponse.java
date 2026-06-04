package com.sigcon.backend.books.application;

import java.time.LocalDate;

import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountingPeriodResponse {

    private Long id;
    private String code;
    private LocalDate startDate;
    private LocalDate endDate;
    private AccountingPeriodStatus status;
}
