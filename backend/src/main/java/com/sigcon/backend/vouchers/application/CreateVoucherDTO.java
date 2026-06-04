package com.sigcon.backend.vouchers.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.sigcon.backend.accounting_entry.application.AccountingEntryLineRequest;
import com.sigcon.backend.lists_accounting.accounting_account.domain.model.enums.AccountNature;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor 
@AllArgsConstructor

public class CreateVoucherDTO {

    
    private Long voucherTypeId;
    private String number;
    private LocalDate date;
    private BigDecimal amount;
    private String description;
    private Long paymentFormId;
    private Long bankAccountId;
    private Long cashAccountId;
    private Long checkId;
    private Long assetId;


    private List<AccountingEntryLineRequest> lines;

}
