package com.sigcon.backend.vouchers.domain.service;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.sigcon.backend.accounting_entry.domain.model.enums.TypeAccountingEntryLine;
import com.sigcon.backend.lists_accounting.accounting_account.domain.model.AccountingAccount;
import com.sigcon.backend.lists_accounting.accounting_account.domain.repository.AccountingAccountRepository;
import com.sigcon.backend.lists_accounting.accounting_lists.domain.model.enums.AccountClass;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.vouchers.application.AccountingAccountOptionDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VoucherAccountingAccountFilterService {

    private final AccountingAccountRepository accountingAccountRepository;

    public List<AccountingAccountOptionDTO> filterForVoucherLine(
            Company company,
            String voucherTypeCode,
            TypeAccountingEntryLine lineType
    ) {
        return filterForVoucherLine(company, voucherTypeCode, lineType, false);
    }

    public List<AccountingAccountOptionDTO> filterForVoucherLine(
            Company company,
            String voucherTypeCode,
            TypeAccountingEntryLine lineType,
            boolean excludeTreasuryAccounts
    ) {
        String typeCode = voucherTypeCode != null ? voucherTypeCode.trim().toUpperCase() : "";
        FilterRule rule = resolveRule(typeCode, lineType, excludeTreasuryAccounts);

        return accountingAccountRepository.findAllActiveByCompany(company).stream()
                .filter(account -> matchesRule(account, rule))
                .filter(account -> !excludeTreasuryAccounts || !isTreasuryAccountCode(account.getPucAccount().getCode()))
                .map(this::toOption)
                .toList();
    }

    public boolean isAccountAllowed(Company company, String voucherTypeCode, TypeAccountingEntryLine lineType, String accountCode) {
        return isAccountAllowed(company, voucherTypeCode, lineType, accountCode, false);
    }

    public boolean isAccountAllowed(
            Company company,
            String voucherTypeCode,
            TypeAccountingEntryLine lineType,
            String accountCode,
            boolean excludeTreasuryAccounts
    ) {
        if (!StringUtils.hasText(accountCode)) {
            return false;
        }
        if (excludeTreasuryAccounts && isTreasuryAccountCode(accountCode)) {
            return false;
        }
        return filterForVoucherLine(company, voucherTypeCode, lineType, excludeTreasuryAccounts).stream()
                .anyMatch(option -> option.getCode().equals(accountCode.trim()));
    }

    public boolean isStandaloneModuleType(String voucherTypeCode) {
        if (!StringUtils.hasText(voucherTypeCode)) {
            return false;
        }
        return switch (voucherTypeCode.trim().toUpperCase()) {
            case "PAYROLL", "SERVICE_PAYMENT", "SERVICE_RECEIPT" -> true;
            default -> false;
        };
    }

    public boolean isOutflowVoucherType(String voucherTypeCode) {
        if (!StringUtils.hasText(voucherTypeCode)) {
            return false;
        }
        String code = voucherTypeCode.trim().toUpperCase();
        return "PAYROLL".equals(code) || "SERVICE_PAYMENT".equals(code) || "PAYMENT".equals(code);
    }

    public TypeAccountingEntryLine standaloneCounterpartLineType(String voucherTypeCode) {
        return isOutflowVoucherType(voucherTypeCode)
                ? TypeAccountingEntryLine.DEBIT
                : TypeAccountingEntryLine.CREDIT;
    }

    public boolean isTreasuryAccountCode(String accountCode) {
        if (!StringUtils.hasText(accountCode)) {
            return false;
        }
        String code = accountCode.trim();
        return code.startsWith("11") || code.startsWith("12");
    }

    public boolean usesAutoAccountingWithInvoice(String voucherTypeCode) {
        String code = voucherTypeCode != null ? voucherTypeCode.trim().toUpperCase() : "";
        return "PAYMENT".equals(code) || "RECEIPT".equals(code);
    }

    public boolean requiresManualAccountingLines(String voucherTypeCode, Long invoiceId) {
        if (invoiceId != null && usesAutoAccountingWithInvoice(voucherTypeCode)) {
            return false;
        }
        String code = voucherTypeCode != null ? voucherTypeCode.trim().toUpperCase() : "";
        return !"PAYMENT".equals(code) && !"RECEIPT".equals(code) || invoiceId == null;
    }

    private FilterRule resolveRule(String voucherTypeCode, TypeAccountingEntryLine lineType) {
        return resolveRule(voucherTypeCode, lineType, false);
    }

    private FilterRule resolveRule(String voucherTypeCode, TypeAccountingEntryLine lineType, boolean excludeTreasuryAccounts) {
        if (excludeTreasuryAccounts && isStandaloneModuleType(voucherTypeCode)) {
            return resolveStandaloneCounterpartRule(voucherTypeCode, lineType);
        }

        boolean debit = lineType == TypeAccountingEntryLine.DEBIT;

        return switch (voucherTypeCode) {
            case "PAYMENT", "SERVICE_PAYMENT", "PAYROLL" -> debit
                    ? new FilterRule(
                    EnumSet.of(AccountClass.LIABILITY, AccountClass.EXPENSE, AccountClass.COST_OF_SALES, AccountClass.PRODUCTION_COST),
                    List.of("2", "5", "6", "7")
            )
                    : new FilterRule(EnumSet.of(AccountClass.ASSET), List.of("11", "12"));
            case "RECEIPT", "SERVICE_RECEIPT" -> debit
                    ? new FilterRule(EnumSet.of(AccountClass.ASSET), List.of("11", "12"))
                    : new FilterRule(
                    EnumSet.of(AccountClass.ASSET, AccountClass.REVENUE, AccountClass.LIABILITY),
                    List.of("13", "4", "2")
            );
            default -> debit
                    ? new FilterRule(
                    EnumSet.of(AccountClass.ASSET, AccountClass.EXPENSE, AccountClass.COST_OF_SALES, AccountClass.LIABILITY),
                    List.of()
            )
                    : new FilterRule(
                    EnumSet.of(AccountClass.ASSET, AccountClass.REVENUE, AccountClass.LIABILITY, AccountClass.EQUITY),
                    List.of()
            );
        };
    }

    private FilterRule resolveStandaloneCounterpartRule(String voucherTypeCode, TypeAccountingEntryLine lineType) {
        boolean outflow = isOutflowVoucherType(voucherTypeCode);
        if ("PAYROLL".equals(voucherTypeCode) && lineType == TypeAccountingEntryLine.DEBIT) {
            return new FilterRule(
                    EnumSet.of(AccountClass.LIABILITY, AccountClass.EXPENSE, AccountClass.COST_OF_SALES),
                    List.of("25", "51", "52", "72")
            );
        }
        if (outflow && lineType == TypeAccountingEntryLine.DEBIT) {
            return new FilterRule(
                    EnumSet.of(AccountClass.LIABILITY, AccountClass.EXPENSE, AccountClass.COST_OF_SALES, AccountClass.PRODUCTION_COST),
                    List.of("2", "5", "6", "7")
            );
        }
        if (!outflow && lineType == TypeAccountingEntryLine.CREDIT) {
            return new FilterRule(
                    EnumSet.of(AccountClass.REVENUE, AccountClass.LIABILITY),
                    List.of("4", "2")
            );
        }
        return new FilterRule(EnumSet.noneOf(AccountClass.class), List.of());
    }

    private boolean matchesRule(AccountingAccount account, FilterRule rule) {
        if (account.getPucAccount() == null) {
            return false;
        }
        AccountClass accountClass = account.getPucAccount().getAccountClass();
        if (!rule.classes().contains(accountClass)) {
            return false;
        }
        if (rule.codePrefixes().isEmpty()) {
            return true;
        }
        String code = account.getPucAccount().getCode();
        if (!StringUtils.hasText(code)) {
            return false;
        }
        return rule.codePrefixes().stream().anyMatch(code::startsWith);
    }

    private AccountingAccountOptionDTO toOption(AccountingAccount account) {
        String code = account.getPucAccount().getCode();
        String name = StringUtils.hasText(account.getCustomName())
                ? account.getCustomName()
                : account.getPucAccount().getName();
        return AccountingAccountOptionDTO.builder()
                .id(account.getId())
                .code(code)
                .label(code + " - " + name)
                .accountClass(account.getPucAccount().getAccountClass())
                .nature(account.getNature() != null ? account.getNature().name() : null)
                .build();
    }

    private record FilterRule(Set<AccountClass> classes, List<String> codePrefixes) {
        FilterRule(Set<AccountClass> classes, List<String> codePrefixes) {
            this.classes = classes != null ? classes : EnumSet.noneOf(AccountClass.class);
            this.codePrefixes = codePrefixes != null ? codePrefixes : List.of();
        }
    }
}
