package com.sigcon.backend.invoices.application.requests.dataInvoices;

import java.time.LocalDate;

import com.sigcon.backend.invoices.domain.model.enums.StatusesInvoices;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Header {
    @Schema (description = "ID externo de la factura", example = "1234567890")
    private String DocumentId;

    @Schema (description = "Prefijo de la factura", example = "DISR")
    private String prefix;

    @Schema (description = "Serial de la factura", example = "0017")
    private String serial;

    @Schema (description = "Tipo de factura", example = "01")
    private Type type;

    @Schema (description = "Fecha de emisión de la factura", example = "2025-05-15")
    private LocalDate issueDate;

    @Schema (description = "Fecha de vencimiento de la factura", example = "2025-05-30")
    private LocalDate dueDate;

    @Schema (description = "Estado de la factura", example = "PENDING - PAID")
    private StatusesInvoices status;
}
