package com.sigcon.backend.invoices.application.responses;

import java.math.BigDecimal;

import com.sigcon.backend.assets.assets.application.AssetSkippedDTO;
import com.sigcon.backend.assets.assets.application.ProductDTO;
import com.sigcon.backend.invoices.application.requests.dataLineInvoices.Discounts;
import com.sigcon.backend.products.application.products.ProductResponse;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Item de la factura")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LineInvoice {
    @Schema(description = "ID del item", example = "1")
    private Long id;

    @Schema(description = "Nombre del item", example = "1")
    private String name;

    @Schema(description = "Código del item", example = "1")
    private String code;

    @Schema(description = "Descripción del item", example = "1")
    private String description;

    @Schema(description = "Cantidad del item", example = "1")
    private BigDecimal quantity;

    @Schema(description = "Precio del item", example = "100000")
    private BigDecimal price;

    @Schema(description = "ID del producto", example = "1")
    private ProductResponse product;

    @Schema(description = "Activo del item", example = "1")
    private AssetSkippedDTO asset;

    @Schema(description = "Descuento del item", example = "10000")
    private Discounts discount;

}
