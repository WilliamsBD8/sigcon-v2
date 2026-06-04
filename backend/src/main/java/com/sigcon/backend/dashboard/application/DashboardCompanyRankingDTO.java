package com.sigcon.backend.dashboard.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardCompanyRankingDTO {
    private Long companyId;
    private String companyName;
    private BigDecimal totalAmount;
}
