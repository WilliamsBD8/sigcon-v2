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
public class DashboardKpiDTO {
    private Long totalCompanies;
    private Long totalUsers;
    private Long totalInvoices;
    private Long totalVouchers;
    private Long totalAssets;
    private Long totalBankAccounts;
    private BigDecimal totalInvoiceAmount;
    private BigDecimal totalVoucherAmount;
    private BigDecimal totalBankBalance;
}
