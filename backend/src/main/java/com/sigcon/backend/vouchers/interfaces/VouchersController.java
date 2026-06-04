package com.sigcon.backend.vouchers.interfaces;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sigcon.backend.invoices.application.requests.dataInvoices.Transaction;
import com.sigcon.backend.invoices.domain.services.InvoiceService;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableResponse;
import com.sigcon.backend.utils.ErrorRespondJson;
import com.sigcon.backend.utils.SuccessRespondJson;
import com.sigcon.backend.utils.UserUtil;
import com.sigcon.backend.vouchers.application.VoucherAccountingAccountsRequest;
import com.sigcon.backend.vouchers.domain.models.VoucherTypesEntity;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;
import com.sigcon.backend.vouchers.domain.repository.VoucherRepository;
import com.sigcon.backend.vouchers.domain.service.VoucherAccountingAccountFilterService;
import com.sigcon.backend.vouchers.domain.service.VoucherService;
import com.sigcon.backend.vouchers.domain.service.VoucherTypeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
@Tag(name = "5. Módulo de Contabilidad", description = "Endpoints para gestion de contabilidad")
public class VouchersController {

    private final VoucherService voucherService;
    private final InvoiceService invoiceService;
    private final VoucherRepository voucherRepository;
    private final VoucherTypeService voucherTypeService;
    private final VoucherAccountingAccountFilterService voucherAccountingAccountFilterService;
    private final UserUtil userUtil;

    @PostMapping("/search")
    @Operation(summary = "Buscar vouchers", description = "RF01 - Consulta paginada con filtros avanzados (DataTable).<br>Permiso requerido: PERM_SEARCH_VOUCHER o ROLE_SUPERADMIN")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Vouchers encontrados"),
        @ApiResponse(responseCode = "400", description = "Error al buscar vouchers")
    })
    @PreAuthorize("hasAuthority('PERM_SEARCH_VOUCHER') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> search(@RequestBody(required = false) DataTableRequest request, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }
        return voucherService.getVouchers(request);
    }

    @GetMapping("/third-parties")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listThirdPartiesByRole(@RequestParam(name = "role") String role) {
        return ResponseEntity.ok(
                SuccessRespondJson.getSuccessRespondMessage(
                        Optional.of("Terceros consultados correctamente"),
                        Optional.of(voucherService.listThirdPartiesByRole(role))
                )
        );
    }

    @PostMapping("/types")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> listTypes(
            @RequestBody(required = false) DataTableRequest request, BindingResult bindingResult
    ) {
        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }

        List<VoucherTypesEntity> voucherTypes = voucherService.getVouchersTypes(request);
        return ResponseEntity.ok(
            DataTableResponse.from(
                voucherTypes.stream().map(voucherService::voucherTypeToDto).collect(Collectors.toList()), request.getDraw())
        );
        
    }

    @PostMapping("/accounting-accounts/filter")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> filterAccountingAccounts(@Valid @RequestBody VoucherAccountingAccountsRequest request) {
        return ResponseEntity.ok(
                SuccessRespondJson.getSuccessRespondMessage(
                        Optional.of("Cuentas contables filtradas correctamente"),
                        Optional.of(voucherAccountingAccountFilterService.filterForVoucherLine(
                                userUtil.getUser().getCompany(),
                                request.getVoucherTypeCode(),
                                request.getLineType(),
                                Boolean.TRUE.equals(request.getExcludeTreasuryAccounts())
                        ))
                )
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SEARCH_VOUCHER') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(
                SuccessRespondJson.getSuccessRespondMessage(
                        Optional.of("Comprobante consultado correctamente"),
                        Optional.of(voucherService.getVoucherDetail(id))
                )
        );
    }

    @PostMapping("/create")
    @Operation(summary = "Crear voucher", description = "RF01 - Crear voucher.<br>Permiso requerido: PERM_CREATE_VOUCHER o ROLE_SUPERADMIN")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Voucher creado"),
        @ApiResponse(responseCode = "400", description = "Error al crear voucher")
    })
    @PreAuthorize("hasAuthority('PERM_CREATE_VOUCHER') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> create(@RequestBody Transaction request, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }
        try {
            Long voucherTypeId = voucherService.resolveVoucherTypeId(request);
            VouchersEntity voucher = voucherService.createVoucher(request, voucherTypeId);
            if (request.getInvoiceId() != null) {
                invoiceService.validateState(request.getInvoiceId());
            }
            return ResponseEntity.ok(
                    SuccessRespondJson.getSuccessRespondMessage(
                            Optional.of("Comprobante creado exitosamente"),
                            Optional.of(voucherService.toDto(voucher))
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ErrorRespondJson.getErrorRespondMessage(Optional.of(e.getMessage()))
            );
        }
    }

    @GetMapping("/files/vouchers/{fileName}")
    @Operation(summary = "Obtener archivo de voucher", description = "Obtiene un archivo de voucher")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {

        try {

            Path path = Paths.get("uploads/vouchers").resolve(fileName);

            Resource resource = new UrlResource(path.toUri());

            if(!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("El archivo no existe");
            }

            String contentType = Files.probeContentType(path);

            return ResponseEntity.ok()
                .contentType(
                    MediaType.parseMediaType(
                        contentType != null 
                            ? contentType 
                            : "application/octet-stream"
                    )
                )
                .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + resource.getFilename() + "\""
                )
                .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("Error al obtener el archivo", e);
        }
    }

    @PutMapping("/update/{id}")
    @Operation(summary = "Actualizar voucher", description = "Actualiza un voucher")
    @PreAuthorize("hasAuthority('PERM_UPDATE_VOUCHER') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Transaction request) {
        try {
            if (request.getInvoiceId() == null) {
                VouchersEntity existing = voucherRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("El comprobante no existe"));
                if (existing.getInvoice() != null) {
                    request.setInvoiceId(existing.getInvoice().getId());
                }
            }
            VouchersEntity existing = voucherRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("El comprobante no existe"));
            Long voucherTypeId = voucherService.resolveVoucherTypeId(
                    request,
                    existing.getVoucherType() != null ? existing.getVoucherType().getId() : null
            );
            VouchersEntity voucher = voucherService.updateVoucher(id, request, voucherTypeId);

            if (request.getInvoiceId() != null) {
                invoiceService.validateState(request.getInvoiceId());
            }

            return ResponseEntity.ok(
                    SuccessRespondJson.getSuccessRespondMessage(
                            Optional.of("Comprobante actualizado exitosamente"),
                            Optional.of(voucherService.toDto(voucher))
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ErrorRespondJson.getErrorRespondMessage(Optional.of(e.getMessage()))
            );
        }
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "Eliminar voucher", description = "Elimina un voucher")
    @PreAuthorize("hasAuthority('PERM_DELETE_VOUCHER') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        VouchersEntity voucher = voucherRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("El voucher no existe"));

        voucherService.deleteVoucher(voucher.getId());

        if(voucher.getInvoice() != null) {
            invoiceService.validateState(voucher.getInvoice().getId());
        }

        return ResponseEntity.ok(
            SuccessRespondJson.getSuccessRespondMessage(
                Optional.of("Comprobante eliminado exitosamente"),
                Optional.empty()
            )
        );
    }
}
