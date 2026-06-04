package com.sigcon.backend.invoices.intefaces;


import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sigcon.backend.invoices.application.responses.dataInvoices.State;
import com.sigcon.backend.invoices.domain.model.InvoiceStates;
import com.sigcon.backend.invoices.domain.services.StateInvoiceService;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableResponse;
import com.sigcon.backend.utils.SuccessRespondJson;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/invoices/states")
@RequiredArgsConstructor
@Tag(name = "6. Módulo de Facturas", description = "Endpoints para gestión de facturas")
public class StatesInvoicesController {

    private final StateInvoiceService stateInvoiceService;

    @PostMapping("/page")
    @Operation(summary = "Obtener estados de facturas", description = "Obtiene estados de facturas")
    public ResponseEntity<?> getInvoiceStates(@RequestBody DataTableRequest dtRequest) {
        List<InvoiceStates> invoiceStates = stateInvoiceService.getInvoiceStates(dtRequest);
        List<State> states = stateInvoiceService.toDtos(invoiceStates);
        return ResponseEntity.ok(
            DataTableResponse.from(states, dtRequest.getDraw())
        );
    }

}
