package com.sigcon.backend.books.domain.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.sigcon.backend.books.domain.model.AccountingPeriod;
import com.sigcon.backend.books.domain.model.DiaryBook;
import com.sigcon.backend.books.domain.model.GeneralLedger;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.books.domain.repository.AccountingPeriodRepository;
import com.sigcon.backend.books.domain.repository.GeneralLedgerRepository;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.utils.UserUtil;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class GeneralLedgerService {

    private final GeneralLedgerRepository generalLedgerRepository;
    private final AccountingPeriodRepository accountingPeriodRepository;
    private final UserUtil userUtil;

    public void createGeneralLedger(AccountingPeriod accountingPeriod) {
        Company company = accountingPeriod.getCompany();
        Optional<GeneralLedger> lastGeneralLedger = generalLedgerRepository.findLastByCompany(company);

        if(!lastGeneralLedger.isPresent()) {
            GeneralLedger generalLedger = new GeneralLedger();
            generalLedger.setTotalDebit(BigDecimal.ZERO);
            generalLedger.setTotalCredit(BigDecimal.ZERO);
            generalLedger.setBalance(BigDecimal.ZERO);
            generalLedger.setClosingBalance(BigDecimal.ZERO);
            generalLedger.setAccountingPeriod(accountingPeriod);
            generalLedgerRepository.save(generalLedger);
            return;
        }else{
            BigDecimal lastBalance = lastGeneralLedger.get().getBalance();            
            lastGeneralLedger.get().setBalance(lastBalance);
            lastGeneralLedger.get().setClosingBalance(lastBalance);
            generalLedgerRepository.save(lastGeneralLedger.get());

            GeneralLedger generalLedger = new GeneralLedger();
            generalLedger.setTotalDebit(BigDecimal.ZERO);
            generalLedger.setTotalCredit(BigDecimal.ZERO);
            generalLedger.setBalance(lastBalance);
            generalLedger.setClosingBalance(lastBalance);
            generalLedger.setAccountingPeriod(accountingPeriod);
            generalLedgerRepository.save(generalLedger);
            return;
        }

    }

    public void resetGeneralLedgerValues() {
        Company company = userUtil.getUser().getCompany();
        AccountingPeriodStatus status = AccountingPeriodStatus.OPEN;
        Optional<AccountingPeriod> period = accountingPeriodRepository.findByCompanyAndStatus(company, status);
        if(period.isPresent()) {
            List<DiaryBook> diaryBooks = period.get().getGeneralLedger().getDiaryBooks();

            BigDecimal totalDebit = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;
            for(DiaryBook diaryBook : diaryBooks) {
                totalDebit = totalDebit.add(diaryBook.getDebit());
                totalCredit = totalCredit.add(diaryBook.getCredit());
            }
            period.get().getGeneralLedger().setTotalDebit(totalDebit);
            period.get().getGeneralLedger().setTotalCredit(totalCredit);
            period.get().getGeneralLedger().setBalance(totalDebit.subtract(totalCredit));
            generalLedgerRepository.save(period.get().getGeneralLedger());
        }
    }

    public void updateGeneralLedgerAddDiaryBook(VouchersEntity voucher) {
        GeneralLedger generalLedger = voucher.getDiaryBook().getGeneralLedger();
        generalLedger.setTotalDebit(generalLedger.getTotalDebit().add(voucher.getAccountingEntry().getDebit()));
        generalLedger.setTotalCredit(generalLedger.getTotalCredit().add(voucher.getAccountingEntry().getCredit()));
        generalLedger.setBalance(generalLedger.getClosingBalance().add(voucher.getAmount()));
        generalLedgerRepository.save(generalLedger);
    }
}
