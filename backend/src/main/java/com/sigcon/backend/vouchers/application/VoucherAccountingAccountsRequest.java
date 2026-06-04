package com.sigcon.backend.vouchers.application;

import com.sigcon.backend.accounting_entry.domain.model.enums.TypeAccountingEntryLine;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherAccountingAccountsRequest {

    @NotBlank
    private String voucherTypeCode;

    @NotNull
    private TypeAccountingEntryLine lineType;

    /** Si es true, no lista cuentas de bancos/caja (11*, 12*); se usan desde el método de pago. */
    private Boolean excludeTreasuryAccounts;
}
