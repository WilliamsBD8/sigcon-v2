package com.sigcon.backend.products.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.sigcon.backend.products.domain.models.ProductAccounting;

public interface ProductAccountingRepository extends JpaRepository<ProductAccounting, Long>, JpaSpecificationExecutor<ProductAccounting> {

}
