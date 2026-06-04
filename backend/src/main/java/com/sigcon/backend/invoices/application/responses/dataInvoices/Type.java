package com.sigcon.backend.invoices.application.responses.dataInvoices;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Respuesta con los datos de un tipo de factura")
public class Type {

    @Schema (description = "ID único interno del tipo de factura", example = "1")
    private Long id;

    @Schema (description = "Código del tipo de factura", example = "FV")
    private String code;

    @Schema (description = "Código numérico del tipo de factura", example = "01")
    private Integer codeNumber;

    @Schema (description = "Nombre del tipo de factura", example = "Factura de Venta")
    private String name;
}
