package com.sigcon.backend.products.domain.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.sigcon.backend.products.domain.models.ProductEntity;
import com.sigcon.backend.products.domain.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductInventoryService {

    private final ProductRepository productRepository;

    public void applyStockMovement(Long productId, BigDecimal quantityDelta, String invoiceTypeCode) {
        if (productId == null || quantityDelta == null || quantityDelta.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        if (!"FC".equals(invoiceTypeCode) && !"FV".equals(invoiceTypeCode)) {
            return;
        }

        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("El producto no existe"));

        BigDecimal current = product.getStock() != null ? product.getStock() : BigDecimal.ZERO;
        BigDecimal next = current.add(quantityDelta);

        if ("FV".equals(invoiceTypeCode) && next.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Stock insuficiente para el producto \"" + product.getName()
                            + "\". Disponible: " + current.toPlainString());
        }

        product.setStock(next);
        productRepository.save(product);
    }

    public BigDecimal movementDeltaForLine(String invoiceTypeCode, BigDecimal quantity) {
        if (quantity == null) {
            return BigDecimal.ZERO;
        }
        return switch (invoiceTypeCode) {
            case "FC" -> quantity;
            case "FV" -> quantity.negate();
            default -> BigDecimal.ZERO;
        };
    }
}
