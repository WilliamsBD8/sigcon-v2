package com.sigcon.backend.accounting_entry.domain.services;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.sigcon.backend.accounting_entry.application.AccountingEntryLineRequest;
import com.sigcon.backend.accounting_entry.application.AccountingEntryRequest;
import com.sigcon.backend.accounting_entry.domain.model.AccountingEntry;
import com.sigcon.backend.accounting_entry.domain.model.enums.TypeAccountingEntryLine;
import com.sigcon.backend.accounting_entry.domain.repository.AccountingEntryRepository;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.utils.UserUtil;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;
import com.sigcon.backend.vouchers.domain.repository.VoucherRepository;
import com.sigcon.backend.vouchers.domain.service.VoucherService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountingEntryService {

    private final AccountingEntryRepository accountingEntryRepository;
    private final VoucherRepository voucherRepository;

    private final UserUtil userUtil;
    private final AccountingEntryLineService accountingEntryLineService;

    @Transactional
    public AccountingEntry createAccountingEntry(AccountingEntryRequest request) {
        User user = userUtil.getUser();
        Company company = user.getCompany();

        System.out.println("request.getVoucherId(): " + request);

        VouchersEntity voucher = voucherRepository.findById(request.getVoucherId())
            .orElseThrow(() -> new RuntimeException("El comprobante " + request.getVoucherId() + " no existe"));

        
        if(voucher.getDiaryBook().getGeneralLedger().getAccountingPeriod().getStatus().equals(AccountingPeriodStatus.CLOSED)) {
            throw new RuntimeException("El periodo contable no está abierto");
        }

        BigDecimal credit = BigDecimal.ZERO;
        BigDecimal debit = BigDecimal.ZERO;

        for(AccountingEntryLineRequest line : request.getLines()) {
            if(line.getType() == TypeAccountingEntryLine.CREDIT) {
                credit = credit.add(line.getAmount());
            }else if(line.getType() == TypeAccountingEntryLine.DEBIT) {
                debit = debit.add(line.getAmount());
            }else{
                throw new RuntimeException("El tipo de línea no es válido");
            }
        }
        Integer consecutive = getConsecutive(company);
        AccountingEntry accountingEntry = new AccountingEntry();
        accountingEntry.setVoucher(voucher);
        voucher.setAccountingEntry(accountingEntry);
        accountingEntry.setUser(user);
        accountingEntry.setCompany(company);
        accountingEntry.setDescription(request.getDescription());
        accountingEntry.setCredit(credit);
        accountingEntry.setDebit(debit);
        accountingEntry.setConsecutive(consecutive);
        accountingEntry = accountingEntryRepository.save(accountingEntry);
        for(AccountingEntryLineRequest line : request.getLines()) {
            accountingEntryLineService.createAccountingEntryLine(line, accountingEntry.getId());
        }

        return accountingEntry;
    }
    
    private Integer getConsecutive(Company company) {
        Optional<Integer> maxConsecutive = accountingEntryRepository.findMaxConsecutiveByCompany(company);
        Integer consecutive = maxConsecutive.orElse(0) + 1;
        return consecutive;
    }
}
