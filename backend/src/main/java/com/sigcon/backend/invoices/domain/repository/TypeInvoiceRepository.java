package com.sigcon.backend.invoices.domain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sigcon.backend.invoices.domain.model.TypesInvoices;

public interface TypeInvoiceRepository extends JpaRepository<TypesInvoices, Long> {

    Optional<TypesInvoices> findByCode(String code);
    Optional<TypesInvoices> findByCodeNumber(Integer codeNumber);
    Optional<TypesInvoices> findByCodeOrCodeNumber(String code, Integer codeNumber);
}
