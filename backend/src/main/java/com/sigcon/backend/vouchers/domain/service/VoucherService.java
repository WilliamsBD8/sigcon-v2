package com.sigcon.backend.vouchers.domain.service;

import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.sigcon.backend.accounting_entry.application.AccountingEntryDTO;
import com.sigcon.backend.accounting_entry.application.AccountingEntryLineDTO;
import com.sigcon.backend.accounting_entry.application.AccountingEntryLineRequest;
import com.sigcon.backend.accounting_entry.application.AccountingEntryRequest;
import com.sigcon.backend.accounting_entry.domain.model.AccountingEntry;
import com.sigcon.backend.accounting_entry.domain.model.AccountingEntryLine;
import com.sigcon.backend.accounting_entry.domain.model.enums.TypeAccountingEntryLine;
import com.sigcon.backend.accounting_entry.domain.repository.AccountingEntryLineRepository;
import com.sigcon.backend.accounting_entry.domain.repository.AccountingEntryRepository;
import com.sigcon.backend.accounting_entry.domain.services.AccountingEntryService;
import com.sigcon.backend.assets.assets.domain.model.Assets;
import com.sigcon.backend.assets.assets.domain.repository.AssetsRepository;
import com.sigcon.backend.banks.bankaccounts.application.BankAccountDTO;
import com.sigcon.backend.banks.bankaccounts.domain.model.BankAccount;
import com.sigcon.backend.banks.bankaccounts.domain.repository.BankAccountRepository;
import com.sigcon.backend.banks.bankaccounts.domain.service.BankAccountService;
import com.sigcon.backend.banks.cash_management.application.CashDTO;
import com.sigcon.backend.banks.cash_management.domain.model.Cash;
import com.sigcon.backend.banks.cash_management.domain.repository.CashRepository;
import com.sigcon.backend.banks.cash_management.domain.service.CashService;
import com.sigcon.backend.banks.checkbooks.domain.model.Checkbook;
import com.sigcon.backend.banks.checkbooks.domain.repository.CheckbookRepository;
import com.sigcon.backend.banks.checks.application.CheckDTO;
import com.sigcon.backend.banks.checks.application.CheckbookDTO;
import com.sigcon.backend.banks.checks.domain.model.Check;
import com.sigcon.backend.banks.checks.domain.model.enums.CheckStatus;
import com.sigcon.backend.banks.checks.domain.repository.CheckRepository;
import com.sigcon.backend.books.domain.model.DiaryBook;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.books.domain.services.DiaryBookService;
import com.sigcon.backend.invoices.application.requests.dataInvoices.ExchangeRate;
import com.sigcon.backend.invoices.application.requests.dataInvoices.Transaction;
import com.sigcon.backend.invoices.domain.model.Invoices;
import com.sigcon.backend.invoices.domain.model.PaymentForms;
import com.sigcon.backend.invoices.domain.model.PaymentMethods;
import com.sigcon.backend.invoices.domain.model.enums.StatusesInvoices;
import com.sigcon.backend.invoices.domain.repository.InvoiceRepository;
import com.sigcon.backend.lists_accounting.accounting_account.domain.model.AccountingAccount;
import com.sigcon.backend.lists_accounting.accounting_account.domain.repository.AccountingAccountRepository;
import com.sigcon.backend.parametrization.companies.domain.model.Company;
import com.sigcon.backend.parametrization.resources.application.PaymentMethodDTO;
import com.sigcon.backend.parametrization.resources.domain.repository.PaymentFormRepository;
import com.sigcon.backend.parametrization.resources.domain.repository.PaymentMethodRepository;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.third_parties.third_parties.application.ThirdPartyDTO;
import com.sigcon.backend.third_parties.third_parties.domain.model.ThirdParty;
import com.sigcon.backend.third_parties.third_parties.domain.model.ThirdPartyRoleCatalog;
import com.sigcon.backend.third_parties.third_parties.domain.repository.ThirdPartyRepository;
import com.sigcon.backend.utils.Currency;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableResponse;
import com.sigcon.backend.utils.DataTableSpecificationBuilder;
import com.sigcon.backend.utils.InvoiceUtil;
import com.sigcon.backend.utils.UserUtil;
import com.sigcon.backend.vouchers.application.VoucherDTO;
import com.sigcon.backend.vouchers.application.VoucherThirdPartyOptionDTO;
import com.sigcon.backend.vouchers.application.VoucherTypeDTO;
import com.sigcon.backend.vouchers.domain.models.VoucherTypesEntity;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;
import com.sigcon.backend.vouchers.domain.models.enums.VoucherTypeEnum;
import com.sigcon.backend.vouchers.domain.repository.VoucherTypeRepository;

import jakarta.transaction.Transactional;

import com.sigcon.backend.vouchers.domain.repository.VoucherRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherTypeRepository voucherTypeRepository;
    private final PaymentFormRepository paymentFormRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final BankAccountRepository bankAccountRepository;
    private final CashRepository cashRepository;
    private final CashService cashService;
    private final CheckRepository checkRepository;
    private final AssetsRepository assetsRepository;
    private final CheckbookRepository checkbookRepository;
    private final InvoiceRepository invoiceRepository;
    private final AccountingAccountRepository accountingAccountRepository;
    private final AccountingEntryRepository accountingEntryRepository;
    private final AccountingEntryLineRepository accountingEntryLineRepository;

    private final AccountingEntryService accountingEntryService;
    private final DiaryBookService diaryBookService;
    private final BankAccountService bankAccountService;
    private final VoucherTypeService voucherTypeService;
    private final VoucherAccountingAccountFilterService voucherAccountingAccountFilterService;
    private final ThirdPartyRepository thirdPartyRepository;

    private final DataTableSpecificationBuilder<VouchersEntity> dataTableSpecificationBuilder =
    new DataTableSpecificationBuilder<>();

    private final DataTableSpecificationBuilder<VoucherTypesEntity> dataTableSpecificationBuilderVoucherTypes =
    new DataTableSpecificationBuilder<>();

    private final UserUtil userUtil;

    @Transactional
    public VouchersEntity createVoucher(Transaction request, Long voicherType) {

        DiaryBook diaryBook = diaryBookService.getDiaryBook();
        User user = userUtil.getUser();
        Company company = user.getCompany();
        VouchersEntity voucherEntity = VouchersEntity.builder().build();
        
        VoucherTypesEntity voucherTypeEntity = voucherTypeRepository.findById(voicherType)
        .orElseThrow(() -> new RuntimeException("El tipo de comprobante no existe"));
        voucherEntity.setVoucherType(voucherTypeEntity);
        
        switch (voucherTypeEntity.getCode()) {
            case "PAYMENT":
            case "RECEIPT":
                if(request.getInvoiceId() == null) {
                    throw new IllegalArgumentException("Debe seleccionar una factura para el comprobante de " + voucherTypeEntity.getName().toLowerCase());
                }
                break;
            case "PAYROLL":
            case "SERVICE_PAYMENT":
            case "SERVICE_RECEIPT":
                if(request.getThirdPartyId() == null) {
                    throw new IllegalArgumentException("Debe seleccionar un tercero para el comprobante de " + voucherTypeEntity.getName().toLowerCase());
                }
                validateThirdParty(voucherEntity, request, company);
                break;
            default:
                throw new IllegalArgumentException("El tipo de comprobante no es válido");
        }
        
        voucherEntity.setDiaryBook(diaryBook);

        if(request.getValuePayment().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El valor de pago debe ser mayor a cero");
        }

        voucherEntity.setAmount(request.getValuePayment());
        
        if(request.getExchangeRate() != null){
            if(request.getExchangeRate().getValue() == null){
                throw new IllegalArgumentException("El valor de la tasa de cambio es requerido.");
            }else if(request.getExchangeRate().getValue() == 0){
                throw new IllegalArgumentException("El valor de la tasa de cambio debe ser mayor a 0.");
            }
            BigDecimal exchangeRateValue = new BigDecimal(String.valueOf(request.getExchangeRate().getValue()));
            BigDecimal valuePayment = Currency.convertCurrency(
                request.getValuePayment(),
                request.getExchangeRate().getCurrencyChanged(),
                request.getExchangeRate().getCurrencyChangedTo(),
                exchangeRateValue
            );
            voucherEntity.setAmount(valuePayment);
        }

        if(request.getInvoiceId() != null) {
            Invoices invoice = invoiceRepository.findById(request.getInvoiceId())
            .orElseThrow(() -> new RuntimeException("La factura no existe"));
            if(invoice.getStatus().equals(StatusesInvoices.PAID)) {
                throw new RuntimeException("La factura ya está pagada en su totalidad y no se puede crear un nuevo comprobante");
            }
            BigDecimal totalPayment = invoice.getTotalPayment();
            BigDecimal totalPayments = invoice.getVouchers().stream()
            .map(VouchersEntity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            totalPayments = totalPayments.add(voucherEntity.getAmount());
            if(totalPayments.compareTo(totalPayment) > 0) {
                throw new RuntimeException("El comprobante excede el total a pagar de la factura");
            }
            voucherEntity.setInvoice(invoice);
        }

        if(request.getFile() != null) {
            if(request.getFile().getBase64() != null){
                try{
                    String fileBase64 = request.getFile().getBase64();
                    String fileName = UUID.randomUUID().toString() + "-" + request.getFile().getName().replace(" ", "_");
                    if(fileBase64.contains(",")) {
                        fileBase64 = fileBase64.split(",")[1];
                    }
                    byte[] fileBytes = Base64.getDecoder().decode(fileBase64);
                    Path path = Paths.get("uploads/vouchers/" + fileName);
                    Files.createDirectories(path.getParent());
                    Files.write(path, fileBytes);
                    voucherEntity.setFile(fileName);
                }catch(Exception e) {
                    throw new RuntimeException("Error al guardar el archivo", e);
                }

            }
        }

        PaymentForms paymentFormEntity = paymentFormRepository.findById(1L)
        .orElseThrow(() -> new RuntimeException("La forma de pago no existe"));

        PaymentMethods paymentMethodEntity = paymentMethodRepository.findById(request.getMethodPaymentId())
        .orElseThrow(() -> new RuntimeException("El método de pago no existe"));


        if (
            (request.getBankAccount() == null) &&
            (request.getCashAccount() == null) &&
            (request.getCheck() == null)
        ) {
            throw new IllegalArgumentException("Debe existir al menos un origen de pago");
        }

        voucherEntity.setNumber(generateVoucherNumber(voucherTypeEntity.getId(), company.getId()));
        voucherEntity.setDate(request.getPaymentDate());

        String description = "";
        if(request.getDescription() == null || request.getDescription().isEmpty()) {
            switch (voucherTypeEntity.getCode()) {
                case "PAYMENT":
                    description = "Pago de compra: " + InvoiceUtil.codeInvoice("FC", voucherEntity.getInvoice().getResolution());
                    break;
                case "RECEIPT":
                    description = "Recibo de venta: " + InvoiceUtil.codeInvoice("FV", voucherEntity.getInvoice().getResolution());
                    break;
                case "PAYROLL":
                    description = "Pago de nomina: " + voucherEntity.getThirdParty().getBusinessName() + " - " + voucherEntity.getThirdParty().getNit();
                    break;
                case "SERVICE_PAYMENT":
                    description = "Pago de servicio: " + voucherEntity.getThirdParty().getBusinessName() + " - " + voucherEntity.getThirdParty().getNit();
                    break;
                case "SERVICE_RECEIPT":
                    description = "Pago por prestacion de servicios: " + voucherEntity.getThirdParty().getBusinessName() + " - " + voucherEntity.getThirdParty().getNit();
                    break;
                default:
                    description = voucherTypeEntity.getName();
                    break;
            }
        }else{
            description = request.getDescription();
        }

        voucherEntity.setDescription(description);
        voucherEntity.setPaymentForm(paymentFormEntity);
        voucherEntity.setPaymentMethod(paymentMethodEntity);
        voucherEntity.setCompany(company);
        voucherEntity.setReference(request.getReference());
        voucherEntity.setUser(user);

        List<Long> banksIds = new ArrayList<>();
        List<Long> cashIds = new ArrayList<>();
        if (request.getBankAccount() != null) {
            BankAccount bankAccount = bankAccountRepository
                .findByIdOrAccountNumber(request.getBankAccount().getId(), request.getBankAccount().getAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException("Cuenta bancaria no encontrada"));
            banksIds.add(bankAccount.getId());
            voucherEntity.setBankAccount(bankAccount);
        }

        if(request.getCashAccount() != null) {
            Cash cashEntity = cashRepository.findById(request.getCashAccount().getId())
            .orElseThrow(() -> new RuntimeException("La cuenta de efectivo no existe"));
            cashIds.add(cashEntity.getId());
            voucherEntity.setCash(cashEntity);
        }

        if(request.getCheck() != null) {
            if(request.getCheck().getId() != null || request.getCheck().getNumberCheck() != null) {
                Check checkEntity = checkRepository.findByIdOrNumberCheck(request.getCheck().getId(), request.getCheck().getNumberCheck())
                .orElseThrow(() -> new RuntimeException("El cheque no existe"));

                if(checkEntity.getValue().compareTo(request.getValuePayment()) != 0) {
                    throw new RuntimeException("El valor del cheque no coincide con el valor del comprobante");
                }
                checkEntity.setStatusCheck(CheckStatus.COBRADO);
                checkRepository.saveAndFlush(checkEntity);
                banksIds.add(checkEntity.getCheckbook().getBankAccount().getId());
                voucherEntity.setCheck(checkEntity);
            }else if (request.getCheck().getCheckbookId() != null || request.getCheck().getCheckbookNumber() != null) {
                Checkbook checkbookEntity = checkbookRepository.findById(request.getCheck().getCheckbookId())
                .orElseThrow(() -> new RuntimeException("La chequera no existe"));
                Check checkEntity = checkRepository.saveAndFlush(Check.builder()
                    .checkbook(checkbookEntity)
                    .numberCheck(request.getCheck().getNumberCheck())
                    .value(request.getValuePayment())
                    .statusCheck(CheckStatus.COBRADO)
                .build());
                banksIds.add(checkEntity.getCheckbook().getBankAccount().getId());
                voucherEntity.setCheck(checkEntity);
            }
        }
        
        
        voucherEntity = voucherRepository.save(voucherEntity);
        createAccountingEntry(voucherEntity, request.getLines());
        diaryBookService.updateValuesDiaryBook();
        banksIds.forEach(bankAccountService::updateBalance);
        cashIds.forEach(cashService::updateBalance);
        return voucherEntity;
    }

    @Transactional
    public ResponseEntity<?> getVouchers(DataTableRequest request) {

        int start = Math.max(0, request.getStart());
        int length = request.getLength();
        int safeLength = length <= 0 ? 20 : length > 100 ? 100 : length;
        int page = start / safeLength;

        User user = userUtil.getUser();

        Pageable pageable = length == -1
                ? Pageable.unpaged()
                : PageRequest.of(page, safeLength);

        Specification<VouchersEntity> spec = dataTableSpecificationBuilder.build(request)
                .and((root, query, cb) -> cb.isNull(root.get("deletedAt")))
                .and((root, query, cb) -> cb.equal(root.get("company"), user.getCompany()));

        if (Boolean.TRUE.equals(request.getStandaloneOnly())) {
            spec = spec.and((root, query, cb) -> cb.isNull(root.get("invoice")));
        }

        Page<VouchersEntity> vouchers = voucherRepository.findAll(spec, pageable);

        return ResponseEntity.ok(DataTableResponse.from(vouchers.map(this::toDto), request.getDraw()));
    }

    @Transactional
    public VouchersEntity updateVoucher(Long id, Transaction request, Long voucherTypeId) {

        VouchersEntity voucher = voucherRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("El voucher no existe"));

        if(voucher.getDiaryBook().getGeneralLedger().getAccountingPeriod().getStatus().equals(AccountingPeriodStatus.CLOSED)) {
            throw new RuntimeException("El periodo contable no está abierto");
        }

        voucher.setAmount(request.getValuePayment());
        
        if(request.getExchangeRate() != null){
            if(request.getExchangeRate().getValue() == null){
                throw new IllegalArgumentException("El valor de la tasa de cambio es requerido.");
            }else if(request.getExchangeRate().getValue() == 0){
                throw new IllegalArgumentException("El valor de la tasa de cambio debe ser mayor a 0.");
            }
            BigDecimal exchangeRateValue = new BigDecimal(String.valueOf(request.getExchangeRate().getValue()));
            BigDecimal valuePayment = Currency.convertCurrency(
                request.getValuePayment(),
                request.getExchangeRate().getCurrencyChanged(),
                request.getExchangeRate().getCurrencyChangedTo(),
                exchangeRateValue
            );
            voucher.setAmount(valuePayment);
        }

        switch (voucher.getVoucherType().getCode()) {
            case "PAYMENT":
            case "RECEIPT":
                if(request.getInvoiceId() == null) {
                    throw new IllegalArgumentException("Debe seleccionar una factura para el comprobante de " + voucher.getVoucherType().getName().toLowerCase());
                }
                break;
            case "PAYROLL":
            case "SERVICE_PAYMENT":
            case "SERVICE_RECEIPT":
                if(request.getThirdPartyId() == null) {
                    throw new IllegalArgumentException("Debe seleccionar un tercero para el comprobante de " + voucher.getVoucherType().getName().toLowerCase());
                }
                validateThirdParty(voucher, request, voucher.getCompany());
                break;
            default:
                throw new IllegalArgumentException("El tipo de comprobante no es válido");
        }

        if(request.getFile() != null) {

            if(
                voucher.getFile() != null &&
                !voucher.getFile().equals(request.getFile().getName())
            ) {
                try{
                    Path path = Paths.get("uploads/vouchers/" + voucher.getFile());
                    Files.delete(path);
                }catch(Exception e) {
                    throw new RuntimeException("Error al eliminar el archivo", e);
                }
            }

            if(request.getFile().getBase64() != null) {
                try{
                    String fileBase64 = request.getFile().getBase64();
                    String fileName = UUID.randomUUID().toString() + "-" + request.getFile().getName().replace(" ", "_");
                    if(fileBase64.contains(",")) {
                        fileBase64 = fileBase64.split(",")[1];
                    }
                    byte[] fileBytes = Base64.getDecoder().decode(fileBase64);
                    Path path = Paths.get("uploads/vouchers/" + fileName);
                    Files.createDirectories(path.getParent());
                    Files.write(path, fileBytes);
                    voucher.setFile(fileName);
                }catch(Exception e) {
                    throw new RuntimeException("Error al guardar el archivo", e);
                }
            }
        }

        if(request.getInvoiceId() != null) {
            Invoices invoice = invoiceRepository.findById(request.getInvoiceId())
            .orElseThrow(() -> new RuntimeException("La factura no existe"));

            BigDecimal totalPayment = invoice.getTotalPayment();
            BigDecimal totalPayments = invoice.getVouchers().stream()
            .filter(voucherEntity -> voucherEntity.getId() != id)
            .map(VouchersEntity::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            totalPayments = totalPayments.add(voucher.getAmount());

            if(totalPayments.compareTo(totalPayment) > 0) {
                throw new RuntimeException("El comprobante excede el total a pagar de la factura");
            }
        }

        List<Long> banksIds = new ArrayList<>();
        List<Long> cashIds = new ArrayList<>();

        if(request.getMethodPaymentId().equals(voucher.getPaymentMethod().getId())) {
            if(voucher.getBankAccount() != null){
                BankAccount oldBankAccount = voucher.getBankAccount();
                if(!Objects.equals(voucher.getBankAccount().getId(), request.getBankAccount().getId())){ // Si la cuenta bancaria es diferente, se actualiza la cuenta bancaria anterior
                    BankAccount bankAccount = bankAccountRepository
                        .findByIdAndDeletedAtIsNull(request.getBankAccount().getId())
                        .orElseThrow(() -> new IllegalArgumentException("Cuenta bancaria no encontrada"));
                    voucher.setBankAccount(bankAccount);
                    banksIds.add(bankAccount.getId());
                }
                banksIds.add(oldBankAccount.getId());
            }else if(voucher.getCheck() != null){
                Check checkOld = voucher.getCheck();
                if(!Objects.equals(voucher.getCheck().getId(), request.getCheck().getId())){
                    Check checkEntity = checkRepository.findByIdOrNumberCheck(request.getCheck().getId(), request.getCheck().getNumberCheck())
                    .orElseThrow(() -> new RuntimeException("El cheque no existe"));
                    if(checkEntity.getValue().compareTo(voucher.getAmount()) != 0) {
                        throw new RuntimeException("El valor del cheque no coincide con el valor del comprobante");
                    }
                    checkEntity.setStatusCheck(CheckStatus.COBRADO);
                    checkRepository.saveAndFlush(checkEntity);
                    banksIds.add(checkEntity.getCheckbook().getBankAccount().getId());
                    checkOld.setStatusCheck(CheckStatus.EMITIDO);
                    checkRepository.saveAndFlush(checkOld);
                    banksIds.add(checkOld.getCheckbook().getBankAccount().getId());
                }
            }else if(voucher.getCash() != null){
                Cash cashOld = voucher.getCash();
                if(!Objects.equals(voucher.getCash().getId(), request.getCashAccount().getId())){
                    Cash cashEntity = cashRepository.findById(request.getCashAccount().getId())
                    .orElseThrow(() -> new RuntimeException("La cuenta de efectivo no existe"));
                    voucher.setCash(cashEntity);
                    cashIds.add(cashEntity.getId());
                }
                cashIds.add(cashOld.getId());
            }
        }
        
        if(request.getPaymentDate() != null && !Objects.equals(voucher.getDate(), request.getPaymentDate())) {
            voucher.setDate(request.getPaymentDate());
        }

        if(request.getDescription() != null && !Objects.equals(voucher.getDescription(), request.getDescription())) {
            voucher.setDescription(request.getDescription());
        }

        if(request.getPaymentFormId() != null && !Objects.equals(voucher.getPaymentForm().getId(), request.getPaymentFormId())) {
            PaymentForms paymentForm = paymentFormRepository.findById(request.getPaymentFormId())
            .orElseThrow(() -> new RuntimeException("La forma de pago no existe"));
            voucher.setPaymentForm(paymentForm);
        }

        if(request.getMethodPaymentId() != null && !Objects.equals(voucher.getPaymentMethod().getId(), request.getMethodPaymentId())) {
            PaymentMethods paymentMethod = paymentMethodRepository.findById(request.getMethodPaymentId())
            .orElseThrow(() -> new RuntimeException("El método de pago no existe"));
            voucher.setPaymentMethod(paymentMethod);
        }

        if(request.getReference() != null && !Objects.equals(voucher.getReference(), request.getReference())) {
            voucher.setReference(request.getReference());
        }

        VouchersEntity updatedVoucher = voucherRepository.save(voucher);
        createAccountingEntry(updatedVoucher, request.getLines());
        banksIds.forEach(bankAccountService::updateBalance);
        cashIds.forEach(cashService::updateBalance);
        return updatedVoucher;
    }

    @Transactional
    public void deleteVoucher(Long id){
        VouchersEntity voucher = voucherRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("El voucher no existe"));

        if(voucher.getDiaryBook().getGeneralLedger().getAccountingPeriod().getStatus().equals(AccountingPeriodStatus.CLOSED)) {
            throw new RuntimeException("El periodo contable no está abierto");
        }

        List<Long> banksIds = new ArrayList<>();
        List<Long> cashIds = new ArrayList<>();

        voucherRepository.delete(voucher);

        if(voucher.getBankAccount() != null) {
            BankAccount bankAccount = voucher.getBankAccount();
            banksIds.add(bankAccount.getId());
        }

        if(voucher.getCheck() != null) {
            Check check = voucher.getCheck();
            check.setStatusCheck(CheckStatus.EMITIDO);
            checkRepository.saveAndFlush(check);
            banksIds.add(check.getCheckbook().getBankAccount().getId());
        }

        if(voucher.getCash() != null) {
            Cash cash = voucher.getCash();
            cashIds.add(cash.getId());
        }
        banksIds.forEach(bankAccountService::updateBalance);
        cashIds.forEach(cashService::updateBalance);
    }

    public AccountingEntry createAccountingEntry(VouchersEntity voucher, List<AccountingEntryLineRequest> lines) {

        if(voucher.getDiaryBook().getGeneralLedger().getAccountingPeriod().getStatus().equals(AccountingPeriodStatus.CLOSED)) {
            throw new RuntimeException("El periodo contable no está abierto");
        }

        AccountingEntry old = voucher.getAccountingEntry();
        if (old != null) {
            voucher.setAccountingEntry(null);
            accountingEntryRepository.delete(old);
        }
        AccountingEntryRequest accountingEntryRequest = new AccountingEntryRequest();
        accountingEntryRequest.setVoucherId(voucher.getId());
        accountingEntryRequest.setLines(new ArrayList<AccountingEntryLineRequest>());
        String description = "Asiento contable del comprobante " + voucher.getNumber();

        VoucherTypeEnum voucherTypeEnum = voucher.getVoucherType().getType();
        String codeAccountPayment = "";
        if(voucher.getBankAccount() != null) {
            codeAccountPayment = voucher.getBankAccount().getAccountingAccount().getPucAccount().getCode();
        }else if(voucher.getCheck() != null) {
            codeAccountPayment = voucher.getCheck().getCheckbook().getBankAccount().getAccountingAccount().getPucAccount().getCode();
        }else if(voucher.getCash() != null) {
            codeAccountPayment = voucher.getCash().getAccountingAccount().getPucAccount().getCode();
        }else {
            throw new RuntimeException("No existe cuenta contable para el origen de pago");
        }
        switch (voucherTypeEnum) {
            case OUTPUT:
                accountingEntryRequest.getLines().add(AccountingEntryLineRequest.builder()
                    .accountingAccountCode(codeAccountPayment)
                    .type(TypeAccountingEntryLine.CREDIT)
                    .amount(voucher.getAmount())
                    .build());
                break;
            case INPUT:
                accountingEntryRequest.getLines().add(AccountingEntryLineRequest.builder()
                    .accountingAccountCode(codeAccountPayment)
                    .type(TypeAccountingEntryLine.DEBIT)
                    .amount(voucher.getAmount())
                    .build());
                break;
            default:
                break;
        }

        switch (voucher.getVoucherType().getCode()) {
            case "PAYMENT":
                description += " - Pago de compra: " + InvoiceUtil.codeInvoice("FC", voucher.getInvoice().getResolution());
                
                String codeAccountCredit = voucher.getInvoice().getThirdParty().getCurrencyType().getIsoCode()
                .equals(voucher.getCompany().getCurrencyType().getIsoCode()) ? "2205" : "2210";
 
                AccountingAccount accountingAccount = accountingAccountRepository.findByPucAccountCodeAndCompany(
                    codeAccountCredit, voucher.getCompany())
                    .orElseThrow(() -> new RuntimeException("No existe cuenta contable para el proveedor"));

                accountingEntryRequest.getLines().add(AccountingEntryLineRequest.builder()
                    .accountingAccountCode(accountingAccount.getPucAccount().getCode())
                    .type(TypeAccountingEntryLine.DEBIT)
                    .amount(voucher.getAmount())
                    .build());
                break;
            case "RECEIPT":
                description += " - Recibo de venta: " + InvoiceUtil.codeInvoice("FV", voucher.getInvoice().getResolutionInvoice());
                String codeAccountReceipt = voucher.getInvoice().getThirdParty().getCurrencyType().getIsoCode()
                .equals(voucher.getCompany().getCurrencyType().getIsoCode()) ? "130505" : "130510";

                AccountingAccount accountingAccountReceipt = accountingAccountRepository.findByPucAccountCodeAndCompany(
                    codeAccountReceipt, voucher.getCompany())
                    .orElse(
                        accountingAccountRepository.findByPucAccountCodeAndCompany("1305", voucher.getCompany())
                            .orElseThrow(() -> new RuntimeException("No existe cuenta contable para el cliente"))
                    );

                accountingEntryRequest.getLines().add(AccountingEntryLineRequest.builder()
                    .accountingAccountCode(accountingAccountReceipt.getPucAccount().getCode())
                    .type(TypeAccountingEntryLine.DEBIT)
                    .amount(voucher.getAmount())
                    .build());
                break;
            case "PAYROLL":
                description += " - Nómina: " + voucher.getThirdParty().getBusinessName() + " - " + voucher.getThirdParty().getNit();
                String codeAccountPayroll = "2505";
                AccountingAccount accountingAccountPayroll = accountingAccountRepository.findByPucAccountCodeAndCompany(codeAccountPayroll, voucher.getCompany())
                    .orElseThrow(() -> new RuntimeException("No existe cuenta contable para la nómina"));
                accountingEntryRequest.getLines().add(AccountingEntryLineRequest.builder()
                    .accountingAccountCode(accountingAccountPayroll.getPucAccount().getCode())
                    .type(TypeAccountingEntryLine.DEBIT)
                    .amount(voucher.getAmount())
                    .build());
                break;
            case "SERVICE_PAYMENT":
                boolean existsLineWith51 = lines.stream()
                    .anyMatch(line -> line.getAccountingAccountCode() != null && line.getAccountingAccountCode().startsWith("51"));
                if(!existsLineWith51) {
                    throw new RuntimeException("Debe existir al menos una línea con código empezado en 51 (Gastos)");
                }

                accountingEntryRequest.getLines().addAll(lines);
                break;
            case "SERVICE_RECEIPT":
                boolean existsLineWith41 = lines.stream()
                    .anyMatch(line -> line.getAccountingAccountCode() != null && line.getAccountingAccountCode().startsWith("41"));
                if(!existsLineWith41) {
                    throw new RuntimeException("Debe existir al menos una línea con código empezado en 41 (Ingresos)");
                }
                accountingEntryRequest.getLines().addAll(lines);
                break;
            default:
                break;
        }

        System.out.println("accountingEntryRequest: " + accountingEntryRequest);
        System.out.println("lineRequest: " + lines);

        accountingEntryRequest.setDescription(description);
        AccountingEntry newAccountingEntry = accountingEntryService.createAccountingEntry(accountingEntryRequest);
        return newAccountingEntry;
    }

    public List<VoucherTypesEntity> getVouchersTypes(DataTableRequest request) {

        int start = Math.max(0, request.getStart());
        int length = request.getLength();
        int safeLength = length <= 0 ? 20 : length > 100 ? 100 : length;
        int page = start / safeLength;

        User user = userUtil.getUser();

        Pageable pageable = length == -1
                ? Pageable.unpaged()
                : PageRequest.of(page, safeLength);

        Specification<VoucherTypesEntity> spec = dataTableSpecificationBuilderVoucherTypes.build(request)
                .and((root, query, cb) -> cb.isNull(root.get("deletedAt")));

        Page<VoucherTypesEntity> vouchers = voucherTypeRepository.findAll(spec, pageable);
        return vouchers.getContent();

        // return ResponseEntity.ok(DataTableResponse.from(vouchers.map(this::toDto), request.getDraw()));
    }

    public VoucherTypeDTO voucherTypeToDto(VoucherTypesEntity voucherType) {
        return VoucherTypeDTO.builder()
                .id(voucherType.getId())
                .name(voucherType.getName())
                .code(voucherType.getCode())
                .description(voucherType.getDescription())
                .build();
    }
    
    public List<VouchersEntity> getVouchersPeriodOpen() {
        return voucherRepository.findAllByOpenPeriod(AccountingPeriodStatus.OPEN);
    }


    public VouchersEntity getVoucherById(Long id) {
        return voucherRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("El voucher no existe"));
    }

    private void validateThirdParty(VouchersEntity voucher, Transaction request, Company company) {
        if(voucher.getThirdParty() != null){
            if(request.getThirdPartyId().equals(voucher.getThirdParty().getId())) {
                return;
            }
        }
        ThirdParty thirdParty =  thirdPartyRepository.findById(request.getThirdPartyId())
        .orElseThrow(() -> new RuntimeException("El tercero no existe"));
        switch (voucher.getVoucherType().getCode()) {
            case "PAYROLL":
                validateThirdPartyRoles(thirdParty, new String[] {"EMPLEADO"}, company);
                // validateThirdPartyCurrency(thirdParty, company, request.getExchangeRate(), voucher.getVoucherType().getName());
                break;
            case "SERVICE_PAYMENT":
                validateThirdPartyRoles(thirdParty, new String[] {"PROVEEDOR"}, company);
                // validateThirdPartyCurrency(thirdParty, company, request.getExchangeRate(), voucher.getVoucherType().getName());
                break;
            case "SERVICE_RECEIPT":
                validateThirdPartyRoles(thirdParty, new String[] {"CLIENTE"}, company);
                // validateThirdPartyCurrency(thirdParty, company, request.getExchangeRate(), voucher.getVoucherType().getName());
                break;
            default:
                throw new RuntimeException("El tercero no tiene el rol requerido");
        }

        voucher.setThirdParty(thirdParty);
    }
    
    private void validateThirdPartyRoles(ThirdParty thirdParty, String[] roles, Company company) {
        boolean hasRole = thirdParty.getRoles()
            .stream()
            .map(ThirdPartyRoleCatalog::getName)
            .anyMatch(roleName ->
                    java.util.Arrays.asList(roles).contains(roleName));
        if(!hasRole) {
            throw new IllegalArgumentException("El tercero no tiene el rol requerido");
        }
    }

    private void validateThirdPartyCurrency(ThirdParty thirdParty, Company company, ExchangeRate exchangeRate, String voucherType) {
        
        if(
            !thirdParty.getCurrencyType().getIsoCode().equals(company.getCurrencyType().getIsoCode())
            && exchangeRate == null
        ) {
            throw new IllegalArgumentException("Debe seleccionar la tasa de cambio para el comprobante de " + voucherType.toLowerCase()
            + " (" + thirdParty.getCurrencyType().getIsoCode() + ") a (" + company.getCurrencyType().getIsoCode() + ")");
        }
    }

    public List<VoucherThirdPartyOptionDTO> listThirdPartiesByRole(String roleName) {
        if (!StringUtils.hasText(roleName)) {
            throw new IllegalArgumentException("Debe indicar el rol del tercero.");
        }
        return thirdPartyRepository.findAllActiveByRoleName(roleName.trim()).stream()
                .map(this::toThirdPartyOption)
                .toList();
    }

    public VoucherDTO getVoucherDetail(Long id) {
        User user = userUtil.getUser();
        VouchersEntity voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("El comprobante no existe"));
        if (!voucher.getCompany().getId().equals(user.getCompany().getId())) {
            throw new IllegalArgumentException("No tiene permisos para consultar este comprobante.");
        }
        return toDto(voucher);
    }

    public Long resolveVoucherTypeId(Transaction request) {
        return resolveVoucherTypeId(request, null);
    }

    public Long resolveVoucherTypeId(Transaction request, Long fallbackTypeId) {
        if (request.getVoucherTypeId() != null) {
            return request.getVoucherTypeId();
        }
        if (fallbackTypeId != null) {
            return fallbackTypeId;
        }
        if (request.getInvoiceId() != null) {
            Invoices invoice = invoiceRepository.findById(request.getInvoiceId())
                    .orElseThrow(() -> new RuntimeException("La factura no existe"));
            String invoiceTypeCode = invoice.getTypeInvoice().getCode();
            if ("FC".equalsIgnoreCase(invoiceTypeCode)) {
                return voucherTypeRepository.findByCode("PAYMENT")
                        .map(VoucherTypesEntity::getId)
                        .orElse(1L);
            }
            if ("OC".equalsIgnoreCase(invoiceTypeCode)) {
                return voucherTypeRepository.findByCode("RECEIPT")
                        .map(VoucherTypesEntity::getId)
                        .orElse(2L);
            }
            
            if ("OF".equalsIgnoreCase(invoiceTypeCode)) {
                return voucherTypeRepository.findByCode("RECEIPT")
                        .map(VoucherTypesEntity::getId)
                        .orElse(2L);
            }
        }
        throw new IllegalArgumentException("Debe seleccionar el tipo de comprobante.");
    }

    private void validateManualAccountingLines(Transaction request, VoucherTypesEntity voucherType, Company company) {
        if (!voucherAccountingAccountFilterService.requiresManualAccountingLines(
                voucherType.getCode(), request.getInvoiceId())) {
            return;
        }

        boolean standaloneModule = request.getInvoiceId() == null
                && voucherAccountingAccountFilterService.isStandaloneModuleType(voucherType.getCode());

        if (standaloneModule) {
            validateStandaloneThirdParty(request, voucherType);
            validateStandaloneManualLines(request, voucherType, company);
            return;
        }

        List<AccountingEntryLineRequest> lines = request.getLines();
        if (voucherType.getCode().equals("SERVICE_PAYMENT") || voucherType.getCode().equals("SERVICE_RECEIPT")) {
            if (lines == null || lines.size() < 1) {
                throw new IllegalArgumentException("Debe registrar al menos una línea contable.");
            }
            return;
        }

        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;

        for (AccountingEntryLineRequest line : lines) {
            validateAccountingLine(line, voucherType, company, false);
            if (line.getType() == TypeAccountingEntryLine.DEBIT) {
                debit = debit.add(line.getAmount());
            } else if (line.getType() == TypeAccountingEntryLine.CREDIT) {
                credit = credit.add(line.getAmount());
            }
        }

        if (debit.compareTo(credit) != 0) {
            throw new IllegalArgumentException("El total débito debe ser igual al total crédito.");
        }
        if (request.getValuePayment() != null && debit.compareTo(request.getValuePayment()) != 0) {
            throw new IllegalArgumentException("El monto del comprobante debe coincidir con el total del asiento.");
        }
    }

    private void validateStandaloneThirdParty(Transaction request, VoucherTypesEntity voucherType) {
        String code = voucherType.getCode();
        if (!"PAYROLL".equalsIgnoreCase(code)) {
            return;
        }
        if (request.getThirdPartyId() == null) {
            throw new IllegalArgumentException("Debe seleccionar el empleado para el comprobante de nómina.");
        }
        ThirdParty thirdParty = thirdPartyRepository.findByIdAndDeletedAtIsNull(request.getThirdPartyId())
                .orElseThrow(() -> new IllegalArgumentException("El empleado seleccionado no existe."));
        boolean isEmployee = thirdParty.getRoles() != null && thirdParty.getRoles().stream()
                .map(ThirdPartyRoleCatalog::getName)
                .anyMatch(name -> "EMPLEADO".equalsIgnoreCase(name));
        if (!isEmployee) {
            throw new IllegalArgumentException("El tercero seleccionado debe tener rol EMPLEADO.");
        }
    }

    private void applyThirdParty(VouchersEntity voucher, Transaction request, VoucherTypesEntity voucherType) {
        if ("PAYROLL".equalsIgnoreCase(voucherType.getCode())) {
            if (request.getThirdPartyId() == null) {
                throw new IllegalArgumentException("Debe seleccionar el empleado para el comprobante de nómina.");
            }
            ThirdParty thirdParty = thirdPartyRepository.findByIdAndDeletedAtIsNull(request.getThirdPartyId())
                    .orElseThrow(() -> new IllegalArgumentException("El empleado seleccionado no existe."));
            voucher.setThirdParty(thirdParty);
            return;
        }
        voucher.setThirdParty(null);
    }

    private void validateStandaloneManualLines(Transaction request, VoucherTypesEntity voucherType, Company company) {
        List<AccountingEntryLineRequest> lines = request.getLines();
        if (lines == null || lines.isEmpty()) {
            if(voucherType.getCode().equals("SERVICE_PAYMENT") || voucherType.getCode().equals("SERVICE_RECEIPT")) {
                throw new IllegalArgumentException("Debe registrar al menos una línea contable.");
            }
        }

        BigDecimal manualDebit = BigDecimal.ZERO;
        BigDecimal manualCredit = BigDecimal.ZERO;
        boolean outflow = voucherAccountingAccountFilterService.isOutflowVoucherType(voucherType.getCode());

        for (AccountingEntryLineRequest line : lines) {
            validateAccountingLine(line, voucherType, company, true);
            if (voucherAccountingAccountFilterService.isTreasuryAccountCode(line.getAccountingAccountCode())) {
                throw new IllegalArgumentException(
                        "Las cuentas de banco o caja se registran con el método de pago; use solo cuentas de contrapartida.");
            }
            if (line.getType() == TypeAccountingEntryLine.DEBIT) {
                manualDebit = manualDebit.add(line.getAmount());
            } else if (line.getType() == TypeAccountingEntryLine.CREDIT) {
                manualCredit = manualCredit.add(line.getAmount());
            }
        }

        // if (request.getValuePayment() != null) {
        //     BigDecimal netManual = outflow
        //             ? manualDebit.subtract(manualCredit)
        //             : manualCredit.subtract(manualDebit);
        //     if (netManual.compareTo(request.getValuePayment()) != 0) {
        //         throw new IllegalArgumentException(
        //                 "La suma de débitos menos créditos (o créditos menos débitos en ingresos) "
        //                         + "de las líneas manuales debe igualar el monto del comprobante.");
        //     }
        // }
    }

    private void validateAccountingLine(
            AccountingEntryLineRequest line,
            VoucherTypesEntity voucherType,
            Company company,
            boolean excludeTreasuryAccounts
    ) {
        if (line.getType() == null || line.getAmount() == null) {
            throw new IllegalArgumentException("Cada línea contable debe tener tipo y monto.");
        }
        if (!StringUtils.hasText(line.getAccountingAccountCode())) {
            throw new IllegalArgumentException("Cada línea contable debe tener una cuenta asociada.");
        }
        if (!voucherAccountingAccountFilterService.isAccountAllowed(
                company,
                voucherType.getCode(),
                line.getType(),
                line.getAccountingAccountCode(),
                excludeTreasuryAccounts)) {
            throw new IllegalArgumentException(
                    "La cuenta " + line.getAccountingAccountCode()
                            + " no es válida para un movimiento "
                            + line.getType().name()
                            + " en comprobantes de tipo "
                            + voucherType.getName());
        }
    }

    private AccountingEntryLineRequest buildTreasuryLine(VouchersEntity voucher) {
        String accountCode = resolveTreasuryAccountCode(voucher);
        boolean outflow = voucherAccountingAccountFilterService.isOutflowVoucherType(
                voucher.getVoucherType().getCode());
        TypeAccountingEntryLine treasuryType = outflow
                ? TypeAccountingEntryLine.CREDIT
                : TypeAccountingEntryLine.DEBIT;

        return AccountingEntryLineRequest.builder()
                .accountingAccountCode(accountCode)
                .type(treasuryType)
                .amount(voucher.getAmount())
                .build();
    }

    private String resolveTreasuryAccountCode(VouchersEntity voucher) {
        if (voucher.getBankAccount() != null
                && voucher.getBankAccount().getAccountingAccount() != null
                && voucher.getBankAccount().getAccountingAccount().getPucAccount() != null) {
            return voucher.getBankAccount().getAccountingAccount().getPucAccount().getCode();
        }
        if (voucher.getCash() != null
                && voucher.getCash().getAccountingAccount() != null
                && voucher.getCash().getAccountingAccount().getPucAccount() != null) {
            return voucher.getCash().getAccountingAccount().getPucAccount().getCode();
        }
        if (voucher.getCheck() != null
                && voucher.getCheck().getCheckbook() != null
                && voucher.getCheck().getCheckbook().getBankAccount() != null
                && voucher.getCheck().getCheckbook().getBankAccount().getAccountingAccount() != null
                && voucher.getCheck().getCheckbook().getBankAccount().getAccountingAccount().getPucAccount() != null) {
            return voucher.getCheck().getCheckbook().getBankAccount().getAccountingAccount().getPucAccount().getCode();
        }
        throw new IllegalArgumentException(
                "Debe seleccionar caja, cuenta bancaria o cheque para registrar la contrapartida de tesorería.");
    }

    // Funciones
    public BigInteger generateVoucherNumber(Long voucherTypeId, Long companyId) {

        BigInteger number = voucherRepository.findTopByVoucherTypeIdAndCompanyIdOrderByNumberDesc(voucherTypeId, companyId);

        if (number == null || number.equals(BigInteger.ZERO)) {
            return BigInteger.ONE;
        } else {
            return number.add(BigInteger.ONE);
        }
    }
    
    public VoucherDTO toDto(VouchersEntity voucher) {
        VoucherTypeDTO voucherType = voucher.getVoucherType() != null
                ? voucherTypeService.toDto(voucher.getVoucherType())
                : null;

        PaymentMethodDTO paymentMethod = null;
        if (voucher.getPaymentMethod() != null) {
            paymentMethod = PaymentMethodDTO.builder()
                    .id(voucher.getPaymentMethod().getId())
                    .name(voucher.getPaymentMethod().getName())
                    .code(voucher.getPaymentMethod().getCode())
                    .description(voucher.getPaymentMethod().getDescription())
                    .build();
        }

        Long invoiceId = null;
        String invoiceLabel = null;
        if (voucher.getInvoice() != null) {
            invoiceId = voucher.getInvoice().getId();
            invoiceLabel = voucher.getInvoice().getTypeInvoice().getCode()
                    + "-" + voucher.getInvoice().getResolutionInvoice();
        }

        return VoucherDTO.builder()
                .id(voucher.getId())
                .number(voucher.getNumber())
                .date(voucher.getDate())
                .amount(voucher.getAmount())
                .description(voucher.getDescription())
                .reference(voucher.getReference())
                .file(voucher.getFile())
                .voucherType(voucherType)
                .paymentMethod(paymentMethod)
                .bankAccount(voucher.getBankAccount() != null ? toBankAccountDto(voucher.getBankAccount()) : null)
                .cashAccount(voucher.getCash() != null ? toCashAccountDto(voucher.getCash()) : null)
                .check(voucher.getCheck() != null ? toCheckDto(voucher.getCheck()) : null)
                .invoiceId(invoiceId)
                .invoiceLabel(invoiceLabel)
                .thirdParty(toThirdPartyDto(voucher.getThirdParty()))
                .accountingEntry(toAccountingEntryDto(voucher.getAccountingEntry()))
                .build();
    }

    private VoucherThirdPartyOptionDTO toThirdPartyOption(ThirdParty entity) {
        String label = entity.getBusinessName()
                + " — NIT " + entity.getNit()
                + (StringUtils.hasText(entity.getDv()) ? "-" + entity.getDv() : "");
        return VoucherThirdPartyOptionDTO.builder()
                .id(entity.getId())
                .thirdPartyCode(entity.getThirdPartyCode())
                .nit(entity.getNit())
                .dv(entity.getDv())
                .businessName(entity.getBusinessName())
                .label(label)
                .build();
    }

    private ThirdPartyDTO toThirdPartyDto(ThirdParty entity) {
        if (entity == null) {
            return null;
        }
        return ThirdPartyDTO.builder()
                .id(entity.getId())
                .thirdPartyCode(entity.getThirdPartyCode())
                .nit(entity.getNit())
                .dv(entity.getDv())
                .businessName(entity.getBusinessName())
                .build();
    }

    private AccountingEntryDTO toAccountingEntryDto(AccountingEntry entry) {
        if (entry == null) {
            return null;
        }
        List<AccountingEntryLine> lines = accountingEntryLineRepository
                .findByAccountingEntry_IdOrderByIdAsc(entry.getId());

        List<AccountingEntryLineDTO> lineDtos = lines.stream().map(line -> AccountingEntryLineDTO.builder()
                .id(line.getId())
                .type(line.getType())
                .amount(line.getAmount())
                .accountingAccount(
                        line.getAccountingAccount() != null && line.getAccountingAccount().getPucAccount() != null
                                ? com.sigcon.backend.lists_accounting.accounting_account.application.AccountingAccountDTO.builder()
                                .id(line.getAccountingAccount().getId())
                                .customName(line.getAccountingAccount().getCustomName())
                                .pucAccount(com.sigcon.backend.lists_accounting.accounting_lists.application.ChartOfAccountResponseDTO.builder()
                                        .code(line.getAccountingAccount().getPucAccount().getCode())
                                        .name(line.getAccountingAccount().getPucAccount().getName())
                                        .build())
                                .build()
                                : null
                )
                .build()).toList();

        return AccountingEntryDTO.builder()
                .id(entry.getId())
                .voucherId(entry.getVoucher() != null ? entry.getVoucher().getId() : null)
                .description(entry.getDescription())
                .debit(entry.getDebit())
                .credit(entry.getCredit())
                .lines(lineDtos)
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private BankAccountDTO toBankAccountDto(BankAccount bankAccount) {
        return BankAccountDTO.builder()
        .id(bankAccount.getId())
        .code(bankAccount.getCode())
        .accountName(bankAccount.getAccountName())
        .build();
    }

    private CashDTO toCashAccountDto(Cash cash) {
        return CashDTO.builder()
        .id(cash.getId())
        .cashName(cash.getCashName())   
        .build();
    }

    private CheckDTO toCheckDto(Check check) {
        return CheckDTO.builder()
        .id(check.getId())
        .checkbook(toCheckbookDto(check.getCheckbook()))
        .numberCheck(check.getNumberCheck())
        .build();
    }

    private CheckbookDTO toCheckbookDto(Checkbook checkbook) {
        return CheckbookDTO.builder()
        .id(checkbook.getId())
        .checkbookNumber(checkbook.getCheckbookNumber())
        .build();
    }
}
