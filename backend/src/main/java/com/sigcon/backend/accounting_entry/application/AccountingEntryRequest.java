package com.sigcon.backend.accounting_entry.application;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor

public class AccountingEntryRequest {

    @NotNull(message = "El ID del comprobante es requerido")
    private Long voucherId;
    
    private String description;

    @NotEmpty(message = "Las líneas son requeridas")
    @Builder.Default
    private List<AccountingEntryLineRequest> lines = new ArrayList<AccountingEntryLineRequest>();
    
}
