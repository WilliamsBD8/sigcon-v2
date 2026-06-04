package com.sigcon.backend.invoices.domain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.sigcon.backend.invoices.domain.model.InvoiceStates;


public interface InvoiceStateRepository extends JpaRepository<InvoiceStates, Long>, JpaSpecificationExecutor<InvoiceStates> {
    Optional<InvoiceStates> findByBlockAndCode(String block, String code);
}
