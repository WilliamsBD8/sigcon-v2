package com.sigcon.backend.invoices.domain.services;

import java.util.HashMap;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.sigcon.backend.invoices.application.requests.LineInvoiceRequest;
import com.sigcon.backend.invoices.application.requests.dataInvoices.ExchangeRate;
import com.sigcon.backend.invoices.application.requests.dataLineInvoices.RulerTax;
import com.sigcon.backend.invoices.domain.model.Invoices;
import com.sigcon.backend.invoices.domain.model.LinesInvoice;
import com.sigcon.backend.invoices.domain.repository.LineInvoiceRepository;
import com.sigcon.backend.lists_accounting.ruler_tax.domain.model.TaxRulerEntity;
import com.sigcon.backend.lists_accounting.ruler_tax.domain.repository.RuleTaxRepository;
import com.sigcon.backend.products.domain.models.ProductEntity;
import com.sigcon.backend.products.domain.repository.ProductRepository;
import com.sigcon.backend.products.domain.service.ProductInventoryService;
import com.sigcon.backend.utils.UserUtil;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class LineInvoiceService {
    private final LineInvoiceRepository lineInvoiceRepository;
    private final ProductRepository productRepository;
    private final RuleTaxRepository taxRuleRepository;
    private final ProductInventoryService productInventoryService;

    @Transactional
    public LinesInvoice createLineInvoice(LineInvoiceRequest lineInvoiceRequest, Invoices invoice, UserUtil userUtil) {
        ProductEntity product = productRepository.findById(lineInvoiceRequest.getProductId())
            .orElseThrow(() -> new RuntimeException("El producto no existe"));
        LinesInvoice lineInvoice = new LinesInvoice();

        Map<String, BigDecimal> totals = new HashMap<>();
        totals = calculateTotal(lineInvoiceRequest, invoice, userUtil);
        lineInvoice.setInvoice(invoice);
        
        lineInvoice.setPrice(totals.get("price"));
        lineInvoice.setTotal(totals.get("totalAmount"));
        lineInvoice.setDiscount(totals.get("totalDiscount"));
        lineInvoice.setTax(totals.get("totalTax"));

        lineInvoice.setAccountingAccountsCodes(lineInvoiceRequest.getAccountingAccountsCodes());
        lineInvoice.setProduct(product);
        // lineInvoice.setIsAsset(lineInvoiceRequest.getIsAsset());
        lineInvoice.setName(lineInvoiceRequest.getName());
        lineInvoice.setCode(lineInvoiceRequest.getCode());
        lineInvoice.setDescription(lineInvoiceRequest.getDescription());
        lineInvoice.setQuantity(lineInvoiceRequest.getQuantity());

        LinesInvoice linesInvoice = lineInvoiceRepository.save(lineInvoice);

        String typeCode = invoice.getTypeInvoice().getCode();
        syncProductPrices(product, linesInvoice.getPrice(), typeCode);
        productInventoryService.applyStockMovement(
                product.getId(),
                productInventoryService.movementDeltaForLine(typeCode, linesInvoice.getQuantity()),
                typeCode
        );

        return linesInvoice;
    }

    @Transactional
    public LinesInvoice updateLineInvoice(Long id, LineInvoiceRequest lineInvoiceRequest, Invoices invoice, UserUtil userUtil){
        LinesInvoice lineInvoice = lineInvoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("La linea de factura no existe"));

        ProductEntity product = productRepository.findById(lineInvoiceRequest.getProductId())
            .orElseThrow(() -> new RuntimeException("El producto no existe"));

        Map<String, BigDecimal> totals = new HashMap<>();
        totals = calculateTotal(lineInvoiceRequest, invoice, userUtil);
        
        lineInvoice.setPrice(totals.get("price"));
        lineInvoice.setTotal(totals.get("totalAmount"));
        lineInvoice.setDiscount(totals.get("totalDiscount"));
        lineInvoice.setTax(totals.get("totalTax"));

        lineInvoice.setAccountingAccountsCodes(lineInvoiceRequest.getAccountingAccountsCodes());

        lineInvoice.setProduct(product);
        // lineInvoice.setIsAsset(lineInvoiceRequest.getIsAsset());
        lineInvoice.setName(lineInvoiceRequest.getName());
        lineInvoice.setCode(lineInvoiceRequest.getCode());
        lineInvoice.setDescription(lineInvoiceRequest.getDescription());
        lineInvoice.setQuantity(lineInvoiceRequest.getQuantity());

        BigDecimal previousQty = lineInvoice.getQuantity();
        LinesInvoice linesInvoice = lineInvoiceRepository.save(lineInvoice);

        String typeCode = invoice.getTypeInvoice().getCode();
        syncProductPrices(product, linesInvoice.getPrice(), typeCode);
        BigDecimal qtyDelta = linesInvoice.getQuantity().subtract(previousQty);
        productInventoryService.applyStockMovement(
                product.getId(),
                productInventoryService.movementDeltaForLine(typeCode, qtyDelta),
                typeCode
        );

        return linesInvoice;
    }

    @Transactional
    public void deleteLineInvoice(Long id){
        LinesInvoice lineInvoice = lineInvoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("La linea de factura no existe"));
        Invoices invoice = lineInvoice.getInvoice();
        if (invoice != null && lineInvoice.getProduct() != null) {
            String typeCode = invoice.getTypeInvoice().getCode();
            productInventoryService.applyStockMovement(
                    lineInvoice.getProduct().getId(),
                    productInventoryService.movementDeltaForLine(typeCode, lineInvoice.getQuantity()).negate(),
                    typeCode
            );
        }
        lineInvoiceRepository.delete(lineInvoice);
    }

    private void syncProductPrices(ProductEntity product, BigDecimal linePrice, String invoiceTypeCode) {
        if (linePrice == null) {
            return;
        }
        if ("FC".equals(invoiceTypeCode) && product.getPrice().compareTo(linePrice) != 0) {
            product.setPrice(linePrice);
            productRepository.save(product);
        }
        if ("FV".equals(invoiceTypeCode)) {
            BigDecimal salePrice = product.getSalePrice() != null ? product.getSalePrice() : BigDecimal.ZERO;
            if (salePrice.compareTo(linePrice) != 0) {
                product.setSalePrice(linePrice);
                productRepository.save(product);
            }
        }
    }

    public Map<String, BigDecimal> calculateTotal(
        LineInvoiceRequest lineInvoiceRequest,
        Invoices invoice,
        UserUtil userUtil
    ) {
        Map<String, BigDecimal> totals = new HashMap<>();
        BigDecimal price = BigDecimal.ZERO;
        if(invoice.getExchangeRate() == null) {
            price = lineInvoiceRequest.getPrice();
        }else{
            price = calculateExchangeRate(lineInvoiceRequest.getPrice(), invoice, userUtil.getUser().getCompany().getCurrencyType().getIsoCode());
        }

        totals.put("price", price);
        totals.put("totalAmount", price.multiply(lineInvoiceRequest.getQuantity()));
        totals.put("totalDiscount", BigDecimal.ZERO);
        if(lineInvoiceRequest.getDiscount() != null) { // Descuento
            if(lineInvoiceRequest.getDiscount().getPercentage() != null && lineInvoiceRequest.getDiscount().getPercentage() != BigDecimal.ZERO) {
                BigDecimal percentagePrice = totals.get("totalAmount").multiply(lineInvoiceRequest.getDiscount().getPercentage());
                BigDecimal discount = percentagePrice.divide(BigDecimal.valueOf(100));
                totals.put("totalDiscount", discount);
            }else{
                totals.put("totalDiscount", lineInvoiceRequest.getDiscount().getValue());
            }
        }

        // Impuesto
        totals.put("totalTax", BigDecimal.ZERO);
        if(lineInvoiceRequest.getTaxRulesIds() != null) {
            BigDecimal totalTax = BigDecimal.ZERO;
            for(RulerTax taxRule : lineInvoiceRequest.getTaxRulesIds()) {
                if(taxRule.getTaxId() != null) {
                    TaxRulerEntity taxRuleEntity = taxRuleRepository.findById(taxRule.getTaxId())
                        .orElseThrow(() -> new RuntimeException("El impuesto no existe"));

                    BigDecimal percentagePrice = totals.get("totalAmount").multiply(BigDecimal.valueOf(taxRuleEntity.getPercentage()));
                    BigDecimal tax = percentagePrice.divide(BigDecimal.valueOf(100));
                    totalTax = totalTax.add(tax);
                }else if(taxRule.getValue() != null && taxRule.getValue() != BigDecimal.ZERO) {
                    totalTax = totalTax.add(taxRule.getValue());
                }else if(taxRule.getPercentage() != null && taxRule.getPercentage() != 0) {
                    BigDecimal percentagePrice = totals.get("totalAmount").multiply(BigDecimal.valueOf(taxRule.getPercentage()));
                    BigDecimal tax = percentagePrice.divide(BigDecimal.valueOf(100));
                    totalTax = totalTax.add(tax);
                }
            }
            totals.put("totalTax", totalTax);
        }

        return totals;
    }

    public BigDecimal calculateExchangeRate(
        BigDecimal price,
        Invoices invoice,
        String baseCurrency
    ) {
        if(invoice.getExchangeRate().getCurrencyExchange().getIsoCode() == invoice.getExchangeRate().getCurrencyExchanged().getIsoCode()) {
            return price;
        }
        if(invoice.getExchangeRate() == null) {
            return price;
        }
        if(invoice.getExchangeRate().getValue() == 0) {
            return price;
        }
        BigDecimal exchangeRateValue = new BigDecimal(String.valueOf(invoice.getExchangeRate().getValue()));
        BigDecimal priceValue = BigDecimal.ZERO;
        if(invoice.getExchangeRate().getCurrencyExchange().getIsoCode() == baseCurrency) {
            priceValue = price.divide(
                exchangeRateValue,
                2, RoundingMode.HALF_UP);
        } else if(invoice.getExchangeRate().getCurrencyExchanged().getIsoCode() == baseCurrency) {
            priceValue = price.multiply(exchangeRateValue);
        } else {
            throw new RuntimeException("No se puede convertir la moneda.");
        }
        return priceValue;
    }
}
