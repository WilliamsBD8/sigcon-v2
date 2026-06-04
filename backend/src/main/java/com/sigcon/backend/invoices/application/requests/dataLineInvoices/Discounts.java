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

public class Discounts {

    @Schema (description = "Valor del descuento", example = "10000")
    @Builder.Default
    private BigDecimal value = BigDecimal.ZERO;

    @Schema (description = "Porcentaje del descuento", example = "10")
    @Builder.Default
    private BigDecimal percentage = BigDecimal.ZERO;
}
