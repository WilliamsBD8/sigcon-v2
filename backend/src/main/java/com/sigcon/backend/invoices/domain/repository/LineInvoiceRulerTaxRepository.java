package com.sigcon.backend.invoices.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.sigcon.backend.invoices.domain.model.LineInvoiceRulersTaxes;

public interface LineInvoiceRulerTaxRepository extends JpaRepository<LineInvoiceRulersTaxes, Long>, JpaSpecificationExecutor<LineInvoiceRulersTaxes> {

    List<LineInvoiceRulersTaxes> findAllByLineInvoiceId(Long lineInvoiceId);
}
