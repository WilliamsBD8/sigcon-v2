package com.sigcon.backend.invoices.application.requests;

import com.sigcon.backend.invoices.application.requests.dataInvoices.ExchangeRate;
import com.sigcon.backend.invoices.application.requests.dataInvoices.Header;
import com.sigcon.backend.invoices.application.requests.dataInvoices.ThirdParty;
import com.sigcon.backend.invoices.application.requests.dataInvoices.Transaction;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class InvoiceRequest {

    @Schema (description = "Cabecera de la factura", example = "{}")
    @NotNull(message = "Necesita agregar la cabecera de la factura")
    private Header header;

    @Schema (description = "Tercero de la factura", example = "{}")
    private ThirdParty thirdParty;

    @Schema (description = "Factura interna de referencia", example = "{}")
    private Long invoiceReference;

    @Schema (description = "Notas", example = "Notas de la factura")
    private String notes;

    @Schema (description = "Tasa de cambio", example = "{}")
    private ExchangeRate exchangeRate;

    @Schema (description = "Transacción", example = "{}")
    private Transaction transaction;

    @Schema (description = "Lista de items", example = "[]")
    @NotNull(message = "Necesita agregar al menos un item a la factura")
    private List<LineInvoiceRequest> lineInvoices;
}
