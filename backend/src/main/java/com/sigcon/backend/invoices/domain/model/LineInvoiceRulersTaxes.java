package com.sigcon.backend.invoices.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import com.sigcon.backend.lists_accounting.ruler_tax.domain.model.TaxRulerEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "line_invoice_rulers_taxes")
@SQLDelete(sql = "UPDATE line_invoice_rulers_taxes SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class LineInvoiceRulersTaxes {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_invoice_id", nullable = false)
    private LinesInvoice lineInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ruler_tax_id", nullable = false)
    private TaxRulerEntity rulerTax;

    @Column(name = "percentage", nullable = true)
    private BigDecimal percentage;

    @Column(name = "value", nullable = true)
    private BigDecimal value;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at", nullable = true)
    private LocalDateTime deletedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
