package com.sigcon.backend.vouchers.application;

import com.sigcon.backend.lists_accounting.accounting_lists.domain.model.enums.AccountClass;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountingAccountOptionDTO {

    private Long id;
    private String code;
    private String label;
    private AccountClass accountClass;
    private String nature;
}
