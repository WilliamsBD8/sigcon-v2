package com.sigcon.backend.products.domain.service;

import org.springframework.stereotype.Service;

import com.sigcon.backend.lists_accounting.accounting_account.domain.model.AccountingAccount;
import com.sigcon.backend.lists_accounting.accounting_account.domain.repository.AccountingAccountRepository;
import com.sigcon.backend.products.application.accounting.ProductAccountingRequest;
import com.sigcon.backend.products.domain.models.ProductAccounting;
import com.sigcon.backend.products.domain.models.ProductEntity;
import com.sigcon.backend.products.domain.repository.ProductAccountingRepository;
import com.sigcon.backend.products.domain.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductAccountingService {

    private final ProductAccountingRepository productAccountingRepository;

    private final ProductRepository productRepository;
    private final AccountingAccountRepository accountingAccountRepository;

    public ProductAccounting createProductAccounting(ProductAccountingRequest productAccountingRequest) {

        ProductEntity product = productRepository.findById(productAccountingRequest.getProductId())
            .orElseThrow(() -> new RuntimeException("El producto no existe"));
        AccountingAccount accountingAccount = accountingAccountRepository.findById(productAccountingRequest.getAccountingAccountId())
            .orElseThrow(() -> new RuntimeException("La cuenta contable no existe"));

        ProductAccounting productAccounting = new ProductAccounting();
        productAccounting.setProduct(product);
        productAccounting.setAccountingAccount(accountingAccount);
        return productAccountingRepository.save(productAccounting);
    }

    public void deleteProductAccounting(Long id) {
        productAccountingRepository.deleteById(id);
    }

}
