package com.sigcon.backend.invoices.application.requests.dataInvoices;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Solicitud para actualizar el estado de una factura")
public class StateUpdateRequest {

    @Schema(description = "Bloque del tipo de factura", example = "1")
    @NotBlank(message = "El bloque del tipo de factura es obligatorio")
    private String block;

    @Schema(description = "Codigo del estado de la factura", example = "1")
    @NotBlank(message = "El codigo del estado de la factura es obligatorio")
    private String code;

    @Schema(description = "Observaciones del estado de factura", example = "Observaciones del estado de factura")
    @NotBlank(message = "Las observaciones son obligatorias")
    private String observations;
}
