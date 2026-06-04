package com.sigcon.backend.products.interfaces;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sigcon.backend.products.application.products.ProductRequest;
import com.sigcon.backend.products.application.products.ProductResponse;
import com.sigcon.backend.products.domain.models.ProductEntity;
import com.sigcon.backend.products.domain.service.ProductService;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableResponse;
import com.sigcon.backend.utils.ErrorRespondJson;
import com.sigcon.backend.utils.SuccessRespondJson;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "5. Módulo de Productos - Productos", description = "Endpoints para gestión de productos")
@RequiredArgsConstructor

public class ProductController {

    private final ProductService productService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('PERM_CREATE_PRODUCT') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequest productRequest, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }
        ProductEntity product = productService.createProduct(productRequest);
        ProductResponse productResponse = productService.toDto(product);
        return ResponseEntity.ok(SuccessRespondJson
            .getSuccessRespondMessage(Optional.of("Producto creado exitosamente"), Optional.of(productResponse)));
    }

    @PostMapping("/page")
    @PreAuthorize("hasAuthority('PERM_VIEW_PRODUCT') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getProductsPage(@RequestBody DataTableRequest dtRequest) {
        DataTableResponse<ProductResponse> response = productService.getAllProducts(dtRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_VIEW_PRODUCT') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        ProductResponse productResponse = productService.getProductById(id);
        return ResponseEntity.ok(
            SuccessRespondJson.getSuccessRespondMessage(
                Optional.of("Producto encontrado exitosamente"),
                Optional.of(productResponse)
            )
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_UPDATE_PRODUCT') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody ProductRequest productRequest, BindingResult bindingResult) {
        if(bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(ErrorRespondJson.getErrorRespondJson(bindingResult));
        }
        ProductEntity product = productService.updateProduct(id, productRequest);
        ProductResponse productResponse = productService.toDto(product);
        return ResponseEntity.ok(SuccessRespondJson.getSuccessRespondMessage(Optional.of("Producto actualizado exitosamente"), Optional.of(productResponse)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DELETE_PRODUCT') or hasAuthority('ROLE_SUPERADMIN')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(SuccessRespondJson.getSuccessRespondMessage(
            Optional.of("Producto eliminado exitosamente"),
            Optional.empty())
        );
    }
    
}
