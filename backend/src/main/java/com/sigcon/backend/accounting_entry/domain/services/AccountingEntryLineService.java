package com.sigcon.backend.accounting_entry.domain.services;

import org.springframework.stereotype.Service;

import com.sigcon.backend.accounting_entry.application.AccountingEntryLineRequest;
import com.sigcon.backend.accounting_entry.domain.model.AccountingEntry;
import com.sigcon.backend.accounting_entry.domain.model.AccountingEntryLine;
import com.sigcon.backend.accounting_entry.domain.repository.AccountingEntryLineRepository;
import com.sigcon.backend.accounting_entry.domain.repository.AccountingEntryRepository;
import com.sigcon.backend.lists_accounting.accounting_account.domain.model.AccountingAccount;
import com.sigcon.backend.lists_accounting.accounting_account.domain.repository.AccountingAccountRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountingEntryLineService {

    private final AccountingEntryLineRepository accountingEntryLineRepository;
    private final AccountingEntryRepository accountingEntryRepository;
    private final AccountingAccountRepository accountingAccountRepository;

    @Transactional
    public AccountingEntryLine createAccountingEntryLine(AccountingEntryLineRequest request, Long accountingEntryId) {

        AccountingEntry accountingEntry = accountingEntryRepository.findById(accountingEntryId)
            .orElseThrow(() -> new RuntimeException("La entrada contable no existe"));

        AccountingAccount accountingAccount = accountingAccountRepository.findByPucAccountCodeAndCompany(request.getAccountingAccountCode(), accountingEntry.getCompany())
            .orElseThrow(() -> new RuntimeException("La cuenta contable con el código " + request.getAccountingAccountCode() + " no existe"));

        AccountingEntryLine accountingEntryLine = new AccountingEntryLine();
        accountingEntryLine.setAccountingEntry(accountingEntry);
        accountingEntryLine.setAccountingAccount(accountingAccount);
        accountingEntryLine.setType(request.getType());
        accountingEntryLine.setAmount(request.getAmount());

        return accountingEntryLineRepository.save(accountingEntryLine);
    }

}
