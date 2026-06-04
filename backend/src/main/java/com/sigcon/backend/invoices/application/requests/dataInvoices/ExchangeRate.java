package com.sigcon.backend.invoices.application.requests.dataInvoices;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ExchangeRate {

    @Schema (description = "ID de la tasa de cambio", example = "1")
    private Long id;

    @Schema (description = "Valor de la tasa de cambio", example = "4000")
    private Double value;
    
    @Schema (description = "Moneda cambiada", example = "COP")
    private String currencyChanged;

    @Schema (description = "Moneda a cambiar", example = "USD")
    private String currencyChangedTo;
}
