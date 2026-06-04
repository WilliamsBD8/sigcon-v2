package com.sigcon.backend.products.domain.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.sigcon.backend.lists_accounting.accounting_account.domain.model.AccountingAccount;
import com.sigcon.backend.lists_accounting.accounting_account.domain.repository.AccountingAccountRepository;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.products.application.accounting.ProductAccountingRequest;
import com.sigcon.backend.products.application.products.ProductRequest;
import com.sigcon.backend.products.application.products.ProductResponse;
import com.sigcon.backend.products.domain.models.ProductAccounting;
import com.sigcon.backend.products.domain.models.ProductEntity;
import com.sigcon.backend.products.domain.repository.ProductRepository;
import com.sigcon.backend.third_parties.third_parties.application.ThirdPartyDTO;
import com.sigcon.backend.third_parties.third_parties.domain.model.ThirdParty;
import com.sigcon.backend.third_parties.third_parties.domain.repository.ThirdPartyRepository;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableResponse;
import com.sigcon.backend.utils.DataTableSpecificationBuilder;
import com.sigcon.backend.utils.UserUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ThirdPartyRepository thirdPartyRepository;
    private final AccountingAccountRepository accountingAccountRepository;

    private final ProductAccountingService productAccountingService;
    private final UserUtil userUtil;
    private final DataTableSpecificationBuilder<ProductEntity> dataTableSpecificationBuilder = new DataTableSpecificationBuilder<>();

    public ProductEntity createProduct(ProductRequest productRequest) {

        User user = userUtil.getUser();
        ThirdParty thirdParty = thirdPartyRepository.findById(productRequest.getThirdPartyId())
            .orElseThrow(() -> new RuntimeException("El tercero no existe"));

        ProductEntity product = new ProductEntity();
        product.setName(productRequest.getName());
        product.setPrice(productRequest.getPrice() != null ? productRequest.getPrice() : BigDecimal.ZERO);
        product.setSalePrice(productRequest.getSalePrice() != null ? productRequest.getSalePrice() : product.getPrice());
        product.setStock(productRequest.getStock() != null ? productRequest.getStock() : BigDecimal.ZERO);
        product.setDescription(productRequest.getDescription());
        product.setCode(productRequest.getCode());
        product.setCompany(user.getCompany());
        product.setThirdParty(thirdParty);

        ProductEntity savedProduct = productRepository.save(product);

        for (Long accountingAccountId : productRequest.getAccountingAccountIds()) {
            ProductAccountingRequest productAccountingRequest = new ProductAccountingRequest();
            productAccountingRequest.setProductId(savedProduct.getId());
            productAccountingRequest.setAccountingAccountId(accountingAccountId);
            productAccountingService.createProductAccounting(productAccountingRequest);
        }

        return savedProduct;
    }

    public DataTableResponse<ProductResponse> getAllProducts(DataTableRequest request) {
        User user = userUtil.getUser();
        int start = Math.max(0, request.getStart());
        int length = request.getLength();
        int safeLength = length <= 0 ? 20 : length;
        int page = start / safeLength;

        Pageable pageable = length == -1 ? Pageable.unpaged() : PageRequest.of(page, safeLength);

        Specification<ProductEntity> spec = dataTableSpecificationBuilder.build(request)
        .and((root, query, cb) -> cb.equal(root.get("company"), user.getCompany()))
        .and((root, query, cb) -> cb.isNull(root.get("deletedAt")));
        
        Page<ProductEntity> pageResult = productRepository.findAll(spec, pageable);
        List<ProductResponse> products = pageResult.getContent().stream()
        .map(this::toDto)
        .collect(Collectors.toList());
        DataTableResponse<ProductResponse> response = DataTableResponse.from(products, request.getDraw());
        return response;
    }

    public ProductResponse getProductById(Long id) {
        ProductEntity product = productRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("El producto no existe"));
        return toDto(product);
    }

    public ProductEntity updateProduct(Long id, ProductRequest productRequest) {
        ProductEntity product = productRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("El producto no existe"));

        ThirdParty thirdParty = thirdPartyRepository.findById(productRequest.getThirdPartyId())
        .orElseThrow(() -> new RuntimeException("El tercero no existe"));

        product.setName(productRequest.getName());
        if (productRequest.getPrice() != null) {
            product.setPrice(productRequest.getPrice());
        }
        if (productRequest.getSalePrice() != null) {
            product.setSalePrice(productRequest.getSalePrice());
        }
        if (productRequest.getStock() != null) {
            product.setStock(productRequest.getStock());
        }
        product.setDescription(productRequest.getDescription());
        product.setCode(productRequest.getCode());
        product.setThirdParty(thirdParty);

        // Eliminar las cuentas contables existentes
        product.getProductAccountings().clear();
        productRepository.saveAndFlush(product);

        List<ProductAccounting> relations = productRequest.getAccountingAccountIds()
        .stream()
        .map(accountingAccountId -> {

            AccountingAccount accountingAccount = accountingAccountRepository
                .findById(accountingAccountId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

            ProductAccounting productAccounting = new ProductAccounting();
            productAccounting.setProduct(product);
            productAccounting.setAccountingAccount(accountingAccount);
            return productAccounting;
        })
        .collect(Collectors.toList());

        product.getProductAccountings().addAll(relations);

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        ProductEntity product = productRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("El producto no existe"));
        productRepository.delete(product);
    }


    // DTOS

    public ProductResponse toDto(ProductEntity product) {
        return ProductResponse.builder()
        .id(product.getId())
        .name(product.getName())
        .description(product.getDescription())
        .code(product.getCode())
        .price(product.getPrice())
        .salePrice(product.getSalePrice())
        .stock(product.getStock())
        .thirdParty(thirdPartyDTO(product.getThirdParty()))
        .accountingAccountIds(
            product.getProductAccountings().stream()
            .map(productAccounting -> productAccounting.getAccountingAccount().getId())
            .toList()
        )
        .createdAt(product.getCreatedAt())
        .build();
    }

    private ThirdPartyDTO thirdPartyDTO(ThirdParty thirdParty) {
        return ThirdPartyDTO.builder()
        .id(thirdParty.getId())
        .businessName(thirdParty.getBusinessName())
        .build();
    }
}
