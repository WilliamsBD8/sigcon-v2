package com.sigcon.backend.vouchers.application;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Tercero disponible para asociar a un comprobante")
public class VoucherThirdPartyOptionDTO {

    @Schema(description = "ID del tercero")
    private Long id;

    @Schema(description = "Código interno")
    private String thirdPartyCode;

    @Schema(description = "NIT")
    private String nit;

    @Schema(description = "DV")
    private String dv;

    @Schema(description = "Nombre o razón social")
    private String businessName;

    @Schema(description = "Etiqueta para listados")
    private String label;
}
