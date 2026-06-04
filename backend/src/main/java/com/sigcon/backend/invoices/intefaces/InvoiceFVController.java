package com.sigcon.backend.invoices.intefaces;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sigcon.backend.invoices.application.requests.InvoiceRequest;
import com.sigcon.backend.invoices.application.responses.InvoiceDTO;
import com.sigcon.backend.invoices.domain.model.Invoices;
import com.sigcon.backend.invoices.domain.model.TypesInvoices;
import com.sigcon.backend.invoices.domain.repository.TypeInvoiceRepository;
import com.sigcon.backend.invoices.domain.services.InvoiceService;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableResponse;
import com.sigcon.backend.utils.ErrorRespondJson;
import com.sigcon.backend.utils.SuccessRespondJson;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/invoices/fv")
@RequiredArgsConstructor
@Tag(name = "6. Módulo de Facturas - Facturas de Venta", description = "Endpoints para gestión de facturas de venta")

public class InvoiceFVController {

    private final InvoiceService invoiceService;
    private final TypeInvoiceRepository typeInvoiceRepository;

    @PostMapping("/create")
    @Operation(summary = "Crear factura de venta")
    @PreAuthorize("hasAuthority('PERM_CREATE_INVOICE_FV') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> createInvoice(@RequestBody InvoiceRequest invoiceRequest, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }
        TypesInvoices typeInvoice = typeInvoiceRepository.findByCodeOrCodeNumber("FV", 1)
                .orElseThrow(() -> new RuntimeException("El tipo de factura no existe"));
        invoiceRequest.getHeader().getType().setCode(typeInvoice.getCode());
        invoiceRequest.getHeader().getType().setCodeNumber(typeInvoice.getCodeNumber());
        Invoices invoice = invoiceService.createInvoice(invoiceRequest);
        InvoiceDTO dto = invoiceService.toDto(invoice);
        return ResponseEntity.ok(
                SuccessRespondJson.getSuccessRespondMessage(
                        Optional.of("Factura de venta creada exitosamente"),
                        Optional.of(dto))
        );
    }

    @PostMapping("/page")
    @Operation(summary = "Listar facturas de venta")
    @PreAuthorize("hasAuthority('PERM_VIEW_INVOICE_FV') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getInvoicesPage(@RequestBody DataTableRequest dtRequest) {
        TypesInvoices typeInvoice = typeInvoiceRepository.findByCodeOrCodeNumber("FV", 1)
                .orElseThrow(() -> new RuntimeException("El tipo de factura no existe"));

        if (dtRequest.getColumns() == null || dtRequest.getColumns().isEmpty()) {
            dtRequest.setColumns(new ArrayList<>());
        }

        dtRequest.getColumns().add(
                new DataTableRequest.DataTableColumn(
                        "typeInvoice.code",
                        "typeInvoice.code",
                        true,
                        true,
                        new DataTableRequest.DataTableSearch(typeInvoice.getCode(), false)
                )
        );

        List<InvoiceDTO> invoices = invoiceService.getInvoicesPage(dtRequest);
        return ResponseEntity.ok(DataTableResponse.from(invoices, dtRequest.getDraw()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_VIEW_INVOICE_FV') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getInvoice(@PathVariable Long id) {
        Invoices invoice = invoiceService.getInvoice(id);
        return ResponseEntity.ok(invoiceService.toDto(invoice));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_UPDATE_INVOICE_FV') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> updateInvoice(
            @PathVariable Long id,
            @RequestBody InvoiceRequest invoiceRequest,
            BindingResult bindingResult
    ) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }
        Invoices invoiceData = invoiceService.getInvoice(id);
        if (!invoiceData.getInvoiceState().getCode().equals("BILLED")) {
            return ResponseEntity.badRequest().body(
                    ErrorRespondJson.getErrorRespondMessage(
                            Optional.of("La factura de venta solo se puede editar en estado facturada"))
            );
        }
        Invoices invoice = invoiceService.updateInvoice(id, invoiceRequest);
        return ResponseEntity.ok(
                SuccessRespondJson.getSuccessRespondMessage(
                        Optional.of("Factura de venta actualizada exitosamente"),
                        Optional.of(invoiceService.toDto(invoice)))
        );
    }
}
