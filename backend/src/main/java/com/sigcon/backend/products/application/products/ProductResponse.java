package com.sigcon.backend.products.application.products;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.sigcon.backend.third_parties.third_parties.application.ThirdPartyDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String code;
    private BigDecimal price;

    private BigDecimal salePrice;
    private ThirdPartyDTO thirdParty;
    private List<Long> accountingAccountIds;
    private BigDecimal stock;
    private LocalDateTime createdAt;
}
