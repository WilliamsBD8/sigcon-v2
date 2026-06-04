package com.sigcon.backend.parametrization.resources.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.sigcon.backend.invoices.domain.model.PaymentMethods;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethods, Long>, JpaSpecificationExecutor<PaymentMethods> {

}
