package com.sigcon.backend.products.application.accounting;

import com.sigcon.backend.products.domain.models.enums.BehaviorType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductAccountingRequest {
    private Long productId;
    private Long accountingAccountId;
}
