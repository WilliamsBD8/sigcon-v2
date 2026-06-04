package com.sigcon.backend.invoices.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.ManyToAny;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import com.sigcon.backend.books.domain.model.AccountingPeriod;
import com.sigcon.backend.invoices.domain.model.enums.StatusesInvoices;
import com.sigcon.backend.lists_accounting.exchangeRates.domain.model.ExchangeRate;
import com.sigcon.backend.lists_accounting.types_of_currency.domain.model.CurrencyType;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.parametrization.companies.domain.model.CompanyLocation;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.third_parties.third_parties.domain.model.ThirdParty;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder.Default;

@Entity
@Table(name = "invoices")
@SQLDelete(sql = "UPDATE invoices SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Invoices {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accounting_period_id", nullable = false)
    private AccountingPeriod accountingPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_invoice_id", nullable = false)
    private TypesInvoices typeInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_state_id", nullable = false)
    private InvoiceStates invoiceState;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_forms_id", nullable = true)
    private PaymentForms paymentForms;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "third_party_id", nullable = true)
    private ThirdParty thirdParty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_origin_id", nullable = true)
    private CompanyLocation locationOrigin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_destination_id", nullable = true)
    private CompanyLocation locationDestination;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_reference_id", nullable = true)
    private Invoices invoiceReference;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "invoiceReference", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Invoices> invoicesReferences = new ArrayList<Invoices>();

    @Column(name = "resolution", nullable = false)
    private String resolution;

    @Column(name = "resolution_invoice", nullable = true)
    private String resolutionInvoice;

    @Column(name = "invoice_date", nullable = true)
    private LocalDate invoiceDate; // Fecha de emisión de la factura

    @Column(name = "invoice_due_day", nullable = false)
    private LocalDate invoiceDueDay; // Fecha de vencimiento de la factura

    @Column(name = "total_payment", nullable = false) // Total a pagar
    @Default
    private BigDecimal totalPayment = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false) // Total neto
    @Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "total_discount", nullable = false) // Total de descuentos
    @Default
    private BigDecimal totalDiscount = BigDecimal.ZERO;

    @Column(name = "total_tax", nullable = false) // Total de impuestos
    @Default
    private BigDecimal totalTax = BigDecimal.ZERO;

    @Column(name = "invoice_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private StatusesInvoices status;

    @Column(name = "notes", nullable = true)
    private String notes;

    @Column(name = "observations", nullable = true)
    private String observations;

    @ManyToOne
    @JoinColumn(name="exchange_rate_id", nullable = true)
    private ExchangeRate exchangeRate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at", nullable = true)
    private LocalDateTime deletedAt;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "invoice")
    @Builder.Default
    private List<LinesInvoice> lineInvoices = new ArrayList<LinesInvoice>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "invoice")
    @Builder.Default
    private List<VouchersEntity> vouchers = new ArrayList<VouchersEntity>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = StatusesInvoices.PENDING;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
