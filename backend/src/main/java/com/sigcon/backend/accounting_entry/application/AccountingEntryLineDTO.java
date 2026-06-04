package com.sigcon.backend.accounting_entry.application;


import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.sigcon.backend.accounting_entry.domain.model.enums.TypeAccountingEntryLine;
import com.sigcon.backend.lists_accounting.accounting_account.application.AccountingAccountDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class AccountingEntryLineDTO {
    private Long id;
    private AccountingAccountDTO accountingAccount;
    private TypeAccountingEntryLine type;
    private BigDecimal amount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
