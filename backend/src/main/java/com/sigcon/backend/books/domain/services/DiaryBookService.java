package com.sigcon.backend.books.domain.services;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.sigcon.backend.accounting_entry.domain.model.AccountingEntry;
import com.sigcon.backend.books.domain.model.AccountingPeriod;
import com.sigcon.backend.books.domain.model.DiaryBook;
import com.sigcon.backend.books.domain.model.GeneralLedger;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.books.domain.repository.AccountingPeriodRepository;
import com.sigcon.backend.books.domain.repository.DiaryBookRepository;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;
import com.sigcon.backend.vouchers.domain.repository.VoucherRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DiaryBookService {

    private final DiaryBookRepository diaryBookRepository;
    private final GeneralLedgerService generalLedgerService;
    private final AccountingPeriodService accountingPeriodService;
    private final AccountingPeriodRepository accountingPeriodRepository;
    private final VoucherRepository voucherRepository;

    public void createDiaryBook(GeneralLedger generalLedger) {
        DiaryBook diaryBook = new DiaryBook();
        diaryBook.setGeneralLedger(generalLedger);
        diaryBook.setDate(LocalDate.now());
        diaryBook.setDescription("Diario de operaciones");
        diaryBook.setCredit(BigDecimal.ZERO);
        diaryBook.setDebit(BigDecimal.ZERO);
        diaryBookRepository.save(diaryBook);
    }

    public DiaryBook getDiaryBook(){
        LocalDate today = LocalDate.now();
        AccountingPeriod accountingPeriod = accountingPeriodService.getAccountingPeriodOpen();
        if(accountingPeriod == null) {
            throw new RuntimeException("No hay un periodo contable abierto");
        }
        GeneralLedger generalLedger = accountingPeriod.getGeneralLedger();
        if(generalLedger == null) {
            throw new RuntimeException("No hay un libro mayor abierto");
        }
        Optional<DiaryBook> diaryBook = diaryBookRepository.findByDate(today, generalLedger);
        if (diaryBook.isPresent()) {
            return diaryBook.get();
        }else{
            createDiaryBook(generalLedger);
            return getDiaryBook();
        }
    }

    public void updateValuesDiaryBook() {
        DiaryBook diaryBook = getDiaryBook();
        List<VouchersEntity> vouchers = voucherRepository.findAllByOpenPeriod(AccountingPeriodStatus.OPEN);

        BigDecimal credit = BigDecimal.ZERO;
        BigDecimal debit = BigDecimal.ZERO;

        for(VouchersEntity voucher : vouchers) {
            AccountingEntry accountingEntry = voucher.getAccountingEntry();
            if(accountingEntry != null) {
                credit = credit.add(accountingEntry.getCredit());
                debit = debit.add(accountingEntry.getDebit());
            }
        }
        diaryBook.setCredit(credit);
        diaryBook.setDebit(debit);
        diaryBookRepository.save(diaryBook);

        generalLedgerService.resetGeneralLedgerValues();
    }

}
