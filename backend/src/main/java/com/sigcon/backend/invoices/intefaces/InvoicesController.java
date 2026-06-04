package com.sigcon.backend.invoices.intefaces;

import java.io.IOException;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sigcon.backend.invoices.application.responses.InvoiceDTO;
import com.sigcon.backend.invoices.domain.services.InvoicePdfService;
import com.sigcon.backend.invoices.domain.services.InvoiceService;
import com.sigcon.backend.utils.ErrorRespondJson;
import com.sigcon.backend.utils.SuccessRespondJson;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
@Tag(name = "6. Módulo de Facturas", description = "Endpoints para gestión de facturas")

public class InvoicesController {
    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una factura", description = "Obtiene una factura")
    @PreAuthorize("hasAuthority('PERM_VIEW_INVOICE') or hasAuthority('PERM_VIEW_INVOICE_FC') or hasAuthority('PERM_VIEW_INVOICE_FV') or hasAuthority('PERM_VIEW_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getInvoice(@PathVariable Long id) {
        InvoiceDTO invoice = invoiceService.toDto(invoiceService.getInvoice(id));
        return ResponseEntity.ok(
            SuccessRespondJson.getSuccessRespondMessage(Optional.of("Factura obtenida exitosamente"),
            Optional.of(invoice))
        );
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Descargar factura en PDF", description = "Genera un PDF con el detalle de la factura")
    @PreAuthorize("hasAuthority('PERM_VIEW_INVOICE') or hasAuthority('PERM_VIEW_INVOICE_FC') or hasAuthority('PERM_VIEW_INVOICE_FV') or hasAuthority('PERM_VIEW_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> downloadPdf(@PathVariable Long id) {
        try {
            byte[] pdf = invoicePdfService.generatePdf(id);
            String filename = "factura-" + id + ".pdf";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(
                    ErrorRespondJson.getErrorRespondMessage(
                            Optional.of("No se pudo generar el PDF: " + e.getMessage())
                    )
            );
        }
    }
}
