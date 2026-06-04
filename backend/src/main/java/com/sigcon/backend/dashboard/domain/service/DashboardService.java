package com.sigcon.backend.dashboard.domain.service;

import com.sigcon.backend.assets.assets.domain.repository.AssetsRepository;
import com.sigcon.backend.banks.bankaccounts.domain.repository.BankAccountRepository;
import com.sigcon.backend.dashboard.application.DashboardCompanyRankingDTO;
import com.sigcon.backend.dashboard.application.DashboardKpiDTO;
import com.sigcon.backend.dashboard.application.DashboardMonthlySeriesDTO;
import com.sigcon.backend.dashboard.application.DashboardOverviewDTO;
import com.sigcon.backend.invoices.domain.repository.InvoiceRepository;
import com.sigcon.backend.parametrization.companies.domain.repository.CompanyRepository;
import com.sigcon.backend.parametrization.users.domain.model.Role;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.parametrization.users.domain.repository.UserRepository;
import com.sigcon.backend.utils.UserUtil;
import com.sigcon.backend.vouchers.domain.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy", new Locale("es", "CO"));

    private final UserUtil userUtil;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final VoucherRepository voucherRepository;
    private final AssetsRepository assetsRepository;
    private final BankAccountRepository bankAccountRepository;

    public DashboardOverviewDTO getOverview() {
        User user = userUtil.getUser();
        boolean isSuperAdmin = user.getRoles().stream()
                .map(Role::getName)
                .anyMatch(roleName -> "SUPERADMIN".equalsIgnoreCase(roleName));

        Long companyIdScope = isSuperAdmin ? null : user.getCompany().getId();
        String companyName = isSuperAdmin ? "Todas las empresas" : user.getCompany().getName();

        DashboardKpiDTO indicators = DashboardKpiDTO.builder()
                .totalCompanies(isSuperAdmin ? orZero(companyRepository.countActiveForDashboard()) : 1L)
                .totalUsers(orZero(userRepository.countForDashboard(companyIdScope)))
                .totalInvoices(orZero(invoiceRepository.countForDashboard(companyIdScope)))
                .totalVouchers(orZero(voucherRepository.countForDashboard(companyIdScope)))
                .totalAssets(orZero(assetsRepository.countForDashboard(companyIdScope)))
                .totalBankAccounts(orZero(bankAccountRepository.countForDashboard(companyIdScope)))
                .totalInvoiceAmount(orZero(invoiceRepository.sumTotalPaymentForDashboard(companyIdScope)))
                .totalVoucherAmount(orZero(voucherRepository.sumAmountForDashboard(companyIdScope)))
                .totalBankBalance(orZero(bankAccountRepository.sumCurrentBalanceForDashboard(companyIdScope)))
                .build();

        LocalDate fromDate = YearMonth.now().minusMonths(5).atDay(1);
        List<DashboardMonthlySeriesDTO> vouchersByMonth = toFullMonthlySeries(
                voucherRepository.monthlyAmountForDashboard(fromDate, companyIdScope),
                fromDate
        );
        List<DashboardMonthlySeriesDTO> invoicesByMonth = toFullMonthlySeries(
                invoiceRepository.monthlyAmountForDashboard(fromDate, companyIdScope),
                fromDate
        );

        return DashboardOverviewDTO.builder()
                .scope(isSuperAdmin ? "GLOBAL" : "COMPANY")
                .companyId(isSuperAdmin ? null : companyIdScope)
                .companyName(companyName)
                .indicators(indicators)
                .vouchersByMonth(vouchersByMonth)
                .invoicesByMonth(invoicesByMonth)
                .topCompaniesByInvoiceAmount(isSuperAdmin
                        ? toRanking(invoiceRepository.topCompaniesByTotalPayment(5))
                        : List.of())
                .topCompaniesByVoucherAmount(isSuperAdmin
                        ? toRanking(voucherRepository.topCompaniesByAmount(5))
                        : List.of())
                .build();
    }

    private List<DashboardMonthlySeriesDTO> toFullMonthlySeries(List<Object[]> rawRows, LocalDate fromDate) {
        Map<YearMonth, BigDecimal> base = new LinkedHashMap<>();
        YearMonth current = YearMonth.from(fromDate);
        YearMonth end = YearMonth.now();
        while (!current.isAfter(end)) {
            base.put(current, BigDecimal.ZERO);
            current = current.plusMonths(1);
        }

        for (Object[] row : rawRows) {
            YearMonth month = null;
            Object rawMonth = row[0];
            if (rawMonth instanceof Timestamp timestamp) {
                month = YearMonth.from(timestamp.toLocalDateTime());
            } else if (rawMonth instanceof java.sql.Date sqlDate) {
                month = YearMonth.from(sqlDate.toLocalDate());
            } else if (rawMonth instanceof LocalDate localDate) {
                month = YearMonth.from(localDate);
            }

            if (month == null || !base.containsKey(month)) {
                continue;
            }
            base.put(month, parseBigDecimal(row[1]));
        }

        List<DashboardMonthlySeriesDTO> response = new ArrayList<>();
        for (Map.Entry<YearMonth, BigDecimal> entry : base.entrySet()) {
            response.add(DashboardMonthlySeriesDTO.builder()
                    .month(entry.getKey().format(MONTH_LABEL_FORMAT))
                    .amount(entry.getValue())
                    .build());
        }

        System.out.println("response: " + response);
        System.out.println("base: " + base);
        System.out.println("rawRows: " + rawRows);
        System.out.println("fromDate: " + fromDate);
        return response;
    }

    private List<DashboardCompanyRankingDTO> toRanking(List<Object[]> rows) {
        List<DashboardCompanyRankingDTO> ranking = new ArrayList<>();
        for (Object[] row : rows) {
            Long companyId = row[0] == null ? null : ((Number) row[0]).longValue();
            String companyName = row[1] == null ? "" : String.valueOf(row[1]);
            BigDecimal total = parseBigDecimal(row[2]);
            ranking.add(DashboardCompanyRankingDTO.builder()
                    .companyId(companyId)
                    .companyName(companyName)
                    .totalAmount(total)
                    .build());
        }
        return ranking;
    }

    private Long orZero(Long value) {
        return value == null ? 0L : value;
    }

    private BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }
}
