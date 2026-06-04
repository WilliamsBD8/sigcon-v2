package com.sigcon.backend.invoices.application.requests;

import java.math.BigDecimal;
import java.util.List;

import com.sigcon.backend.invoices.application.requests.dataLineInvoices.Discounts;
import com.sigcon.backend.invoices.application.requests.dataLineInvoices.RulerTax;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class LineInvoiceRequest {
    @Schema (description = "ID de la linea de factura", example = "1")
    private Long id;

    @Schema (description = "ID del producto", example = "1")
    private Long productId;

    @Schema (description = "ID del activo", example = "1")
    private AssetRequest asset;

    @Schema (description = "Código del item", example = "1")
    private String code;

    @Schema (description = "Nombre del item", example = "1")
    private String name;

    @Schema (description = "Descripción del item", example = "1")
    private String description;

    @Schema (description = "Cantidad", example = "1")
    private BigDecimal quantity;

    @Schema (description = "Precio", example = "100000")
    private BigDecimal price;

    @Schema (description = "Códigos de cuentas contables", example = "['1234567890']")
    private List<String> accountingAccountsCodes;

    @Schema(description = "Impuestos aplicables (IVA, etc.)")
    private List<RulerTax> taxRulesIds;

    @Schema(description = "Retenciones aplicables")
    private List<RulerTax> retentions;

    @Schema (description = "Descuento", example = "10000")
    private Discounts discount;

    @Schema (description = "Se elimina la linea de factura", example = "false")
    @Builder.Default
    private Boolean isDeleted = false;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private class AssetRequest {
        @Schema (description = "ID del activo", example = "1")
        private Long id;

        @Schema (description = "Nombre del activo", example = "1")
        private String name;

        @Schema (description = "Descripción del activo", example = "1")
        private String description;
    }
}
