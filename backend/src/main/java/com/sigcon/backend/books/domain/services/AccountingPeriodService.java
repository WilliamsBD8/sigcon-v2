package com.sigcon.backend.books.domain.services;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.sigcon.backend.banks.bankaccounts.domain.service.BankAccountService;
import com.sigcon.backend.books.application.AccountingPeriodResponse;
import com.sigcon.backend.books.domain.model.AccountingPeriod;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.books.domain.repository.AccountingPeriodRepository;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.parametrization.companies.domain.model.CompanyStatus;
import com.sigcon.backend.parametrization.companies.domain.repository.CompanyRepository;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableSpecificationBuilder;
import com.sigcon.backend.utils.UserUtil;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountingPeriodService {

    private final AccountingPeriodRepository accountingPeriodRepository;
    private final GeneralLedgerService generalLedgerService;
    private final CompanyRepository companyRepository;
    private final BankAccountService bankAccountService;

    // private final 

    private final UserUtil userUtil;

    private final DataTableSpecificationBuilder<AccountingPeriod> accountingPeriodSpecificationBuilder =
            new DataTableSpecificationBuilder<>();

    /**
     * Crea el periodo que contiene la fecha indicada si aun no existe.
     * Util al registrar una empresa o al operar a mitad de un periodo.
     */
    @Transactional
    public AccountingPeriod ensurePeriodContainingDate(Company company, LocalDate date) {
        AccountingPeriod period = buildPeriod(company, date);

        AccountingPeriod savedPeriod = accountingPeriodRepository
                .findByCompanyAndStartDate(company, period.getStartDate())
                .orElseGet(() -> accountingPeriodRepository.save(period));

        if(savedPeriod.getGeneralLedger() == null) {
            generalLedgerService.createGeneralLedger(savedPeriod);
        }

        return savedPeriod;
    }

    /**
     * Crea el periodo del dia solo cuando hoy es el primer dia de un nuevo periodo fiscal.
     */
    @Transactional
    public void createAccountingPeriodForCompany(Company company, LocalDate referenceDate) {
        AccountingPeriod period = buildPeriod(company, referenceDate);
        if (!referenceDate.equals(period.getStartDate())) {
            return;
        }
        AccountingPeriod savedPeriod = accountingPeriodRepository
                .findAllByCompanyAndPeriodOpen(company, AccountingPeriodStatus.OPEN)
                .orElseGet(() -> accountingPeriodRepository.save(period));
        if(savedPeriod.getGeneralLedger() == null) {
            generalLedgerService.createGeneralLedger(savedPeriod);
        }

    }

    @Transactional
    public void createAccountingPeriodsForAllActiveCompanies() {
        LocalDate today = LocalDate.now().withDayOfMonth(1);
        List<Company> companies = companyRepository.findAllByDeletedAtIsNullAndStatus(CompanyStatus.ACTIVE);
        for (Company company : companies) {
            createAccountingPeriodForCompany(company, today);
        }
    }

    @Transactional
    public void closeExpiredAccountingPeriodsForAllCompanies() {
        List<AccountingPeriod> periods = accountingPeriodRepository.findAllByStatusAndEndDateBefore(
                AccountingPeriodStatus.OPEN,
                LocalDate.now()
        );
        for (AccountingPeriod period : periods) {
            period.setStatus(AccountingPeriodStatus.CLOSED);
            bankAccountService.updateCurrentBalance(period.getCompany());
        }
        accountingPeriodRepository.saveAll(periods);
    }

    @Transactional
    public void closeAccountingPeriodManual(Long id) {
        AccountingPeriod period = accountingPeriodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Periodo no encontrado."));
        period.setStatus(AccountingPeriodStatus.CLOSED);
        accountingPeriodRepository.save(period);
    }

    public AccountingPeriod getAccountingPeriodOpen() {
        Company company = userUtil.getUser().getCompany();
        AccountingPeriodStatus status = AccountingPeriodStatus.OPEN;
        Optional<AccountingPeriod> period = accountingPeriodRepository.findByCompanyAndStatus(company, status);
        if (period.isPresent()) {
            return period.get();
        }else{
            return null;
        }
    }

    @Transactional
    public List<AccountingPeriodResponse> getAccountingPeriods(DataTableRequest request) {
        User user = userUtil.getUser();
        Company company = user.getCompany();

        int start = Math.max(0, request.getStart());
        int length = request.getLength();
        int safeLength = length <= 0 ? 20 : length;
        int page = start / safeLength;

        Pageable pageable = length == -1
                ? Pageable.unpaged()
                : PageRequest.of(page, safeLength);

        Specification<AccountingPeriod> spec = accountingPeriodSpecificationBuilder.build(request)
                .and((root, query, cb) -> cb.isNull(root.get("deletedAt")))
                .and((root, query, cb) -> cb.equal(root.get("company"), company));

        Page<AccountingPeriod> periods = accountingPeriodRepository.findAll(spec, pageable);
        return periods.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private AccountingPeriod buildPeriod(Company company, LocalDate date) {
        int monthsPerPeriod = company.getMonthsPerPeriod();
        int fiscalStartMonth = company.getFiscalYearStartMonth();

        LocalDate fiscalYearStart = LocalDate.of(date.getYear(), fiscalStartMonth, 1);
        if (date.isBefore(fiscalYearStart)) {
            fiscalYearStart = fiscalYearStart.minusYears(1);
        }

        int monthDiff = (date.getYear() - fiscalYearStart.getYear()) * 12
                + (date.getMonthValue() - fiscalYearStart.getMonthValue());

        int fiscalPeriod = (monthDiff / monthsPerPeriod) + 1;

        LocalDate startDate = fiscalYearStart.plusMonths((long) (fiscalPeriod - 1) * monthsPerPeriod);
        LocalDate endDate = startDate.plusMonths(monthsPerPeriod).minusDays(1);

        int fiscalYear = fiscalYearStart.getYear();
        String code = buildCode(fiscalYear, fiscalPeriod);

        return AccountingPeriod.builder()
                .company(company)
                .startDate(startDate)
                .endDate(endDate)
                .fiscalPeriod(fiscalPeriod)
                .fiscalYear(fiscalYear)
                .code(code)
                .status(AccountingPeriodStatus.OPEN)
                .build();
    }

    private AccountingPeriodResponse toDTO(AccountingPeriod period) {
        return AccountingPeriodResponse.builder()
                .id(period.getId())
                .code(period.getCode())
                .startDate(period.getStartDate())
                .endDate(period.getEndDate())
                .status(period.getStatus())
                .build();
    }

    private String buildCode(int year, int periodNumber) {
        return "FY" + year + "-P" + periodNumber;
    }
}
