package com.sigcon.backend.accounting_entry.application;

import java.math.BigDecimal;

import com.sigcon.backend.accounting_entry.domain.model.enums.TypeAccountingEntryLine;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountingEntryLineRequest {

    @Schema(description = "El código de la cuenta contable", example = "1234567890")
    private String accountingAccountCode;

    @NotNull(message = "El tipo de línea es requerido")
    private TypeAccountingEntryLine type;

    @NotNull(message = "El monto es requerido")
    private BigDecimal amount;
}
