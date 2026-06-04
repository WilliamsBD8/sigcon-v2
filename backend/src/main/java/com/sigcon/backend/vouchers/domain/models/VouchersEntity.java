package com.sigcon.backend.vouchers.domain.models;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import com.sigcon.backend.accounting_entry.domain.model.AccountingEntry;
import com.sigcon.backend.assets.assets.domain.model.Assets;
import com.sigcon.backend.banks.bankaccounts.domain.model.BankAccount;
import com.sigcon.backend.banks.cash_management.domain.model.Cash;
import com.sigcon.backend.banks.checks.domain.model.Check;
import com.sigcon.backend.books.domain.model.DiaryBook;
import com.sigcon.backend.invoices.domain.model.Invoices;
import com.sigcon.backend.invoices.domain.model.PaymentForms;
import com.sigcon.backend.invoices.domain.model.PaymentMethods;
import com.sigcon.backend.lists_accounting.exchangeRates.domain.model.ExchangeRate;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.third_parties.third_parties.domain.model.ThirdParty;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vouchers")
@SQLDelete(sql = "UPDATE vouchers SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class VouchersEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "number", nullable = false)
    private BigInteger number;

    @ManyToOne
    @JoinColumn(name = "voucher_type_id", nullable = false)
    private VoucherTypesEntity voucherType;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "description", nullable = false)
    private String description;

    @ManyToOne
    @JoinColumn(name = "payment_form_id", nullable = false)
    private PaymentForms paymentForm;

    @ManyToOne
    @JoinColumn(name = "payment_method_id", nullable = false)
    private PaymentMethods paymentMethod;
    
    @Column(name = "reference", nullable = true)
    private String reference;

    @Column(name = "file", nullable = true)
    private String file;

    // Origines de pago
    @ManyToOne
    @JoinColumn(name = "bank_account_id", nullable = true)
    private BankAccount bankAccount;

    @ManyToOne
    @JoinColumn(name = "cash_account_id", nullable = true)
    private Cash cash;

    @ManyToOne
    @JoinColumn(name = "check_id", nullable = true)
    private Check check;
    // Fin origenes de pago

    @ManyToOne
    @JoinColumn(name = "diary_book_id", nullable = false)
    private DiaryBook diaryBook;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = true)
    private Assets asset;

    @ManyToOne
    @JoinColumn(name = "invoice_id", nullable = true)
    private Invoices invoice;

    @ManyToOne
    @JoinColumn(name = "third_party_id", nullable = true)
    private ThirdParty thirdParty;

    @ManyToOne
    @JoinColumn(name="exchange_rate_id", nullable = true)
    private ExchangeRate exchangeRate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at", nullable = true)
    private LocalDateTime deletedAt;

    @OneToOne(mappedBy = "voucher")
    private AccountingEntry accountingEntry;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
