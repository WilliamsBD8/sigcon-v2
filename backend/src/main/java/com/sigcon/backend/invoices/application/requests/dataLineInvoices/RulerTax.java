package com.sigcon.backend.invoices.application.requests.dataLineInvoices;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class RulerTax {
    @Schema (description = "ID del impuesto", example = "1")
    private Long taxId;

    @Schema (description = "Valor de la regla tributaria", example = "10000")
    private BigDecimal value;

    @Schema (description = "Porcentaje de la regla tributaria", example = "10")
    private Double percentage;
}
