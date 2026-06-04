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
@Schema(description = "Respuesta con los datos de un estado de factura")
public class State {
    @Schema(description = "ID único interno del estado de factura", example = "1")
    private Long id;
    @Schema(description = "Nombre del estado de factura", example = "Pendiente")
    private String name;
    @Schema(description = "Código del estado de factura", example = "PENDING")
    private String code;
    @Schema(description = "Color del estado de factura", example = "#000000")
    private String color;
    @Schema(description = "Descripción del estado de factura", example = "Pendiente")
    private String description;
}
