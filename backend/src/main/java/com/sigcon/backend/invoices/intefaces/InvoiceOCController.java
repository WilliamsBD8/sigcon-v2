package com.sigcon.backend.invoices.intefaces;

import java.math.BigDecimal;
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
import com.sigcon.backend.invoices.application.requests.LineInvoiceRequest;
import com.sigcon.backend.invoices.application.requests.dataInvoices.StateUpdateRequest;
import com.sigcon.backend.invoices.application.responses.InvoiceDTO;
import com.sigcon.backend.invoices.domain.model.InvoiceStates;
import com.sigcon.backend.invoices.domain.model.Invoices;
import com.sigcon.backend.invoices.domain.model.LinesInvoice;
import com.sigcon.backend.invoices.domain.model.TypesInvoices;
import com.sigcon.backend.invoices.domain.repository.InvoiceStateRepository;
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
@RequestMapping("/api/v1/invoices/oc")
@RequiredArgsConstructor
@Tag(name = "6. Módulo de Facturas - Orden de compras", description = "Endpoints para gestión de ordenes de compra")

public class InvoiceOCController {
    private final InvoiceService invoiceService;
    private final TypeInvoiceRepository typeInvoiceRepository;

    @PostMapping("/create")
    @Operation(summary = "Crear una orden de compra", description = "Crea una orden de compra")
    @PreAuthorize("hasAuthority('PERM_CREATE_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> createInvoice(@RequestBody InvoiceRequest invoiceRequest, BindingResult bindingResult) {

        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }

        TypesInvoices typeInvoice = typeInvoiceRepository.findByCodeOrCodeNumber("OC", 2)
            .orElseThrow(() -> new RuntimeException("El tipo de factura no existe"));
        invoiceRequest.getHeader().getType().setCode(typeInvoice.getCode());
        invoiceRequest.getHeader().getType().setCodeNumber(typeInvoice.getCodeNumber());
        Invoices invoice = invoiceService.createInvoice(invoiceRequest);
        InvoiceDTO dto = invoiceService.toDto(invoice);
        return ResponseEntity.ok(
            SuccessRespondJson.getSuccessRespondMessage(Optional.of("Orden de compra creada exitosamente"),
            Optional.of(dto))
        );
    }

    @PostMapping("/page")
    @Operation(summary = "Obtener ordenes de compra", description = "Obtiene ordenes de compra")
    @PreAuthorize("hasAuthority('PERM_VIEW_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getInvoicesPage(@RequestBody DataTableRequest dtRequest) {

        TypesInvoices typeInvoice = typeInvoiceRepository.findByCodeOrCodeNumber("OC", 2)
            .orElseThrow(() -> new RuntimeException("El tipo de factura no existe"));

        if(dtRequest.getColumns() == null || dtRequest.getColumns().isEmpty()){
            dtRequest.setColumns(new ArrayList<DataTableRequest.DataTableColumn>());
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
        DataTableResponse<InvoiceDTO> response = DataTableResponse.from(invoices, dtRequest.getDraw());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener una orden de compra", description = "Obtiene una orden de compra")
    @PreAuthorize("hasAuthority('PERM_VIEW_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getInvoice(@PathVariable Long id) {
        Invoices invoice = invoiceService.getInvoice(id);
        InvoiceDTO dto = invoiceService.toDto(invoice);
        return ResponseEntity.ok(
            SuccessRespondJson.getSuccessRespondMessage(Optional.of("Orden de compra obtenida exitosamente"),
            Optional.of(dto))
        );
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar una orden de compra", description = "Actualiza una orden de compra")
    @PreAuthorize("hasAuthority('PERM_UPDATE_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> updateInvoice(@PathVariable Long id, @RequestBody InvoiceRequest invoiceRequest, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }

        Invoices invoiceData = invoiceService.getInvoice(id);

        if(!invoiceData.getInvoiceState().getCode().equals("PENDING_APPROVAL")) {
            return ResponseEntity.badRequest().body(
                ErrorRespondJson.getErrorRespondMessage(
                    Optional.of("La orden de compra no puede ser actualizada porque no está pendiente")
                )
            );
        }

        Invoices invoice = invoiceService.updateInvoice(id, invoiceRequest);
        InvoiceDTO dto = invoiceService.toDto(invoice);
        return ResponseEntity.ok(
            SuccessRespondJson.getSuccessRespondMessage(Optional.of("Orden de compra actualizada exitosamente"),
            Optional.of(dto))
        );
    }

    @PostMapping("/state/{id}")
    @Operation(summary = "Actualizar el estado de una orden de compra", description = "Actualiza el estado de una orden de compra")
    @PreAuthorize(
        "hasAuthority('PERM_APPROVE_INVOICE_OC') or hasAuthority('PERM_REJECT_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')"
    )
    public ResponseEntity<?> updateInvoiceState(@PathVariable Long id, @RequestBody StateUpdateRequest invoiceStateRequest) {
        Invoices invoice = invoiceService.updateInvoiceState(id, invoiceStateRequest);
        InvoiceDTO dto = invoiceService.toDto(invoice);
        return ResponseEntity.ok(SuccessRespondJson.getSuccessRespondMessage(Optional.of("Estado de la orden de compra actualizado exitosamente"), Optional.of(dto)));
    }

    @PostMapping("/received/{id}")
    @Operation(summary = "Recibir una orden de compra", description = "Recibir una orden de compra")
    @PreAuthorize("hasAuthority('PERM_RECEIVE_INVOICE_OC') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> receiveInvoice(@PathVariable Long id, @RequestBody InvoiceRequest invoiceRequest, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }

        Invoices invoiceData = invoiceService.getInvoice(id);

        if(
            invoiceData.getInvoiceState().getCode().equals("PENDING_APPROVAL")
            || invoiceData.getInvoiceState().getCode().equals("REJECTED")
            || invoiceData.getInvoiceState().getCode().equals("RECEIVED")
            || invoiceData.getInvoiceState().getCode().equals("CLOSED")
        ){
            String message = "La orden de compra no puede ser recibida porque no está pendiente de aprobación";
            if(invoiceData.getInvoiceState().getCode().equals("REJECTED")) {
                message = "La orden de compra no puede ser recibida porque ha sido rechazada";
            }
            if(invoiceData.getInvoiceState().getCode().equals("RECEIVED")) {
                message = "La orden de compra ya ha sido recibida";
            }
            if(invoiceData.getInvoiceState().getCode().equals("CLOSED")) {
                message = "La orden de compra ya ha sido cerrada";
            }
            return ResponseEntity.badRequest().body(
                ErrorRespondJson.getErrorRespondMessage(
                    Optional.of(message)
                )
            );
        }

        for (LineInvoiceRequest lineInvoice : invoiceRequest.getLineInvoices()) {

            BigDecimal quantityToReceive = lineInvoice.getQuantity();
        
            BigDecimal quantityOC = invoiceData.getLineInvoices().stream()
                .filter(line -> line.getProduct().getId().equals(lineInvoice.getProductId()))
                .map(LinesInvoice::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
            BigDecimal quantityReceived = invoiceData.getInvoicesReferences().stream()
                .flatMap(invoice -> invoice.getLineInvoices().stream())
                .filter(line -> line.getProduct().getId().equals(lineInvoice.getProductId()))
                .map(LinesInvoice::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
            BigDecimal totalAfterReceive = quantityReceived.add(quantityToReceive);
        
            if (totalAfterReceive.compareTo(quantityOC) > 0) {
        
                BigDecimal available = quantityOC.subtract(quantityReceived);
        
                return ResponseEntity.badRequest().body(
                    ErrorRespondJson.getErrorRespondMessage(
                        Optional.of(
                            "La cantidad de " + lineInvoice.getName() +
                            " excede la orden de compra. Disponible para recibir: " + available
                        )
                    )
                );
            }
        }
            

        Integer totalReceived = invoiceRequest.getLineInvoices().stream()
            .map(line -> line.getQuantity().intValue())
            .reduce(0, (a, b) -> a + b);

        Integer totalOC = invoiceData.getLineInvoices().stream()
            .map(line -> line.getQuantity().intValue())
            .reduce(0, (a, b) -> a + b);

        Integer totalReceivedReferences = invoiceData.getInvoicesReferences().stream()
            .map(invoice -> invoice.getLineInvoices().stream()
                .map(line -> line.getQuantity().intValue())
                .reduce(0, (a, b) -> a + b))
            .reduce(0, (a, b) -> a + b);

        Integer total = totalOC - totalReceivedReferences;

        if(totalReceived > total) {
            return ResponseEntity.badRequest().body(
                ErrorRespondJson.getErrorRespondMessage(
                    Optional.of("La cantidad de items recibidos no puede ser mayor a la orden de compra")
                )
            );
        }

        TypesInvoices typeInvoice = typeInvoiceRepository.findByCodeOrCodeNumber("FC", 4)
            .orElseThrow(() -> new RuntimeException("El tipo de factura no existe"));
        invoiceRequest.getHeader().getType().setCode(typeInvoice.getCode());
        invoiceRequest.getHeader().getType().setCodeNumber(typeInvoice.getCodeNumber());
        invoiceRequest.setInvoiceReference(id);
        Invoices invoice = invoiceService.createInvoice(invoiceRequest);
        StateUpdateRequest stateUpdateRequest = new StateUpdateRequest();
        stateUpdateRequest.setBlock("OC");
        stateUpdateRequest.setObservations(totalReceived == total ? "Recibida completamente" : "Recibida parcialmente");
        stateUpdateRequest.setCode(totalReceived == total ? "RECEIVED" : "PARTIALLY_RECEIVED");
        invoiceService.updateInvoiceState(id, stateUpdateRequest);
        InvoiceDTO dto = invoiceService.toDto(invoice);
        return ResponseEntity.ok(
            SuccessRespondJson.getSuccessRespondMessage(
                Optional.of(totalReceived == total ? "Orden de compra recibida completamente" : "Orden de compra recibida parcialmente"),
                Optional.of(dto)
            )
        );
    }
}
