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

public class Type {

    @Schema (description = "Código del tipo de factura", example = "FV")
    private String code;

    @Schema (description = "Código numerico del tipo de factura", example = "01")
    private Integer codeNumber;

    @Schema (description = "Nombre del tipo de factura", example = "Factura de Venta")
    private String name;
}
