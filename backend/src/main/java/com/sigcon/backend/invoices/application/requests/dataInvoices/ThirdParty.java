package com.sigcon.backend.invoices.application.requests.dataInvoices;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ThirdParty {
    @Schema (description = "ID del tercero", example = "1")
    private Long id;

    @Schema (description = "NIT del tercero", example = "1010115909")
    private String nit;
    
    @Schema (description = "Nombre del tercero", example = "sebastian perdomo cardozo")
    private String name;

    @Schema (description = "Dirección del tercero", example = "null")
    private String address;

    @Schema (description = "Ciudad del tercero", example = "null")
    private String city;

    @Schema (description = "País del tercero", example = "CO")
    private String country;

    @Schema (description = "Email del tercero", example = "sebastianperdomocardozo@hotmail.com")
    private String email;
}
