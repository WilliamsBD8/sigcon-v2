package com.sigcon.backend.invoices.application.responses;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import com.sigcon.backend.invoices.application.requests.dataInvoices.Transaction;
import com.sigcon.backend.invoices.application.responses.dataInvoices.ExchangeRate;
import com.sigcon.backend.invoices.application.responses.dataInvoices.Header;
import com.sigcon.backend.invoices.application.responses.dataInvoices.State;
import com.sigcon.backend.invoices.application.responses.dataInvoices.Values;
import com.sigcon.backend.third_parties.third_parties.application.ThirdPartyDTO;
import com.sigcon.backend.vouchers.application.VoucherDTO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Respuesta con los datos de una factura")
public class InvoiceDTO {
    @Schema(description = "Encabezado de la factura")
    private Header header;
    @Schema(description = "Estado de la factura")
    private State state;
    @Schema(description = "Valores de la factura")
    private Values values;
    @Schema(description = "Tercero de la factura")
    private ThirdPartyDTO thirdParty;
    @Schema(description = "Tasa de cambio")
    private ExchangeRate exchangeRate;
    @Schema(description = "Notas de la factura")
    private String notes;

    @Schema(description = "Transacción")
    private Transaction transaction;

    @Schema(description = "Lista de items")
    private List<LineInvoice> lineInvoices;

    @Schema(description = "Lista de facturas referenciadas")
    private List<InvoiceDTO> invoicesReferences;

    @Schema(description = "Lista de comprobantes")
    private List<VoucherDTO> vouchers;
}
