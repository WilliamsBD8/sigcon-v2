package com.sigcon.backend.products.application.products;

import java.math.BigDecimal;
import java.util.List;

import com.sigcon.backend.products.domain.models.enums.BehaviorType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ProductRequest {

    @NotBlank(message = "El nombre es requerido")
    @Size(max = 255, message = "El nombre no puede superar 255 caracteres")
    private String name;
    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    private String description;
    @NotBlank(message = "El código es requerido")
    @Size(max = 255, message = "El código no puede superar 255 caracteres")
    private String code;
    @NotNull(message = "El tercero es requerido")
    private Long thirdPartyId;

    private BigDecimal price;

    private BigDecimal salePrice;

    private BigDecimal stock;

    @NotEmpty(message = "Las cuentas contables son requeridas")
    private List<Long> accountingAccountIds;
}
