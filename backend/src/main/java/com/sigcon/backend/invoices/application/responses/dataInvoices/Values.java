package com.sigcon.backend.invoices.application.responses.dataInvoices;

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
@Schema(description = "Respuesta con los datos de los valores de una factura")
public class Values {

    @Schema(description = "Total a pagar de la factura", example = "1000000")
    private BigDecimal totalPayment;

    @Schema(description = "Total neto de la factura", example = "1000000")
    private BigDecimal totalAmount;

    @Schema(description = "Total de descuentos de la factura", example = "1000000")
    private BigDecimal totalDiscount;

    @Schema(description = "Total de impuestos de la factura", example = "1000000")
    private BigDecimal totalTax;
}
