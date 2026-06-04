package com.sigcon.backend.dashboard.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDTO {
    private String scope;
    private Long companyId;
    private String companyName;
    private DashboardKpiDTO indicators;
    private List<DashboardMonthlySeriesDTO> vouchersByMonth;
    private List<DashboardMonthlySeriesDTO> invoicesByMonth;
    private List<DashboardCompanyRankingDTO> topCompaniesByInvoiceAmount;
    private List<DashboardCompanyRankingDTO> topCompaniesByVoucherAmount;
}
