package com.sigcon.backend.invoices.domain.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.sigcon.backend.banks.bankaccounts.application.BankAccountDTO;
import com.sigcon.backend.banks.cash_management.application.CashDTO;
import com.sigcon.backend.banks.checks.application.CheckDTO;
import com.sigcon.backend.books.domain.model.AccountingPeriod;
import com.sigcon.backend.books.domain.model.enums.AccountingPeriodStatus;
import com.sigcon.backend.books.domain.services.AccountingPeriodService;
import com.sigcon.backend.invoices.application.requests.InvoiceRequest;
import com.sigcon.backend.invoices.application.requests.LineInvoiceRequest;
import com.sigcon.backend.invoices.application.requests.dataInvoices.StateUpdateRequest;
import com.sigcon.backend.invoices.application.requests.dataInvoices.Transaction;
import com.sigcon.backend.invoices.application.requests.dataLineInvoices.Discounts;
import com.sigcon.backend.invoices.application.responses.InvoiceDTO;
import com.sigcon.backend.invoices.application.responses.LineInvoice;
import com.sigcon.backend.invoices.application.responses.dataInvoices.Header;
import com.sigcon.backend.invoices.application.responses.dataInvoices.State;
import com.sigcon.backend.invoices.application.responses.dataInvoices.Type;
import com.sigcon.backend.invoices.application.responses.dataInvoices.Values;
import com.sigcon.backend.invoices.domain.model.InvoiceStates;
import com.sigcon.backend.invoices.domain.model.Invoices;
import com.sigcon.backend.invoices.domain.model.LinesInvoice;
import com.sigcon.backend.invoices.domain.model.PaymentForms;
import com.sigcon.backend.invoices.domain.model.PaymentMethods;
import com.sigcon.backend.invoices.domain.model.TypesInvoices;
import com.sigcon.backend.invoices.domain.model.enums.StatusesInvoices;
import com.sigcon.backend.invoices.domain.repository.InvoiceRepository;
import com.sigcon.backend.invoices.domain.repository.InvoiceStateRepository;
import com.sigcon.backend.invoices.domain.repository.TypeInvoiceRepository;
import com.sigcon.backend.lists_accounting.exchangeRates.application.service.ExchangeRateService;
import com.sigcon.backend.lists_accounting.exchangeRates.domain.model.ExchangeRate;
import com.sigcon.backend.lists_accounting.exchangeRates.domain.model.Enums.ExchangeType;
import com.sigcon.backend.lists_accounting.exchangeRates.domain.repository.ExchangeRateRepository;
import com.sigcon.backend.lists_accounting.types_of_currency.application.CurrencyTypeResponseDTO;
import com.sigcon.backend.lists_accounting.types_of_currency.domain.model.CurrencyType;
import com.sigcon.backend.lists_accounting.types_of_currency.domain.repository.CurrencyTypeRepository;
import com.sigcon.backend.parametrization.resources.application.PaymentFormsDTO;
import com.sigcon.backend.parametrization.resources.application.PaymentMethodDTO;
import com.sigcon.backend.parametrization.resources.domain.repository.PaymentFormRepository;
import com.sigcon.backend.parametrization.resources.domain.repository.PaymentMethodRepository;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.products.application.products.ProductResponse;
import com.sigcon.backend.third_parties.third_parties.application.ThirdPartyDTO;
import com.sigcon.backend.third_parties.third_parties.domain.model.ThirdParty;
import com.sigcon.backend.third_parties.third_parties.domain.repository.ThirdPartyRepository;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableResponse;
import com.sigcon.backend.utils.DataTableSpecificationBuilder;
import com.sigcon.backend.utils.UserUtil;
import com.sigcon.backend.vouchers.application.CreateVoucherDTO;
import com.sigcon.backend.vouchers.application.VoucherDTO;
import com.sigcon.backend.vouchers.domain.models.VoucherTypesEntity;
import com.sigcon.backend.vouchers.domain.models.VouchersEntity;
import com.sigcon.backend.vouchers.domain.repository.VoucherRepository;
import com.sigcon.backend.vouchers.domain.repository.VoucherTypeRepository;
import com.sigcon.backend.vouchers.domain.service.VoucherService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final TypeInvoiceRepository typeInvoiceRepository;
    private final InvoiceStateRepository invoiceStateRepository;
    private final ThirdPartyRepository thirdPartyRepository;
    private final VoucherTypeRepository voucherTypeRepository;
    private final VoucherRepository voucherRepository;
    private final PaymentFormRepository paymentFormRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    
    private final VoucherService voucherService;
    private final ExchangeRateService exchangeRateService;

    private final LineInvoiceService lineInvoiceService;
    private final AccountingPeriodService accountingPeriodService;

    private final DataTableSpecificationBuilder<Invoices> dataTableSpecificationBuilder = new DataTableSpecificationBuilder<>();

    private final UserUtil userUtil;

    @Transactional
    public Invoices createInvoice(InvoiceRequest invoiceRequest) {
        User user = userUtil.getUser();
        Invoices invoice = new Invoices();

        AccountingPeriod accountingPeriod = accountingPeriodService.getAccountingPeriodOpen();
        invoice.setAccountingPeriod(accountingPeriod);

        TypesInvoices typeInvoice = typeInvoiceRepository.findByCodeOrCodeNumber(
            invoiceRequest.getHeader().getType().getCode(), invoiceRequest.getHeader().getType().getCodeNumber())
            .orElseThrow(() -> new RuntimeException("El tipo de factura no existe"));

        InvoiceStates invoiceState = null;
        switch (typeInvoice.getCode()) {
            case "OC":
                invoiceState = invoiceStateRepository.findByBlockAndCode("OC", "PENDING_APPROVAL")
                    .orElseThrow(() -> new RuntimeException("El estado de la factura no existe"));
                break;

            case "FC":
                invoiceState = invoiceStateRepository.findByBlockAndCode("FC", "BILLED")
                    .orElseThrow(() -> new RuntimeException("El estado de la factura no existe"));
                break;

            case "FV":
                invoiceState = invoiceStateRepository.findByBlockAndCode("FV", "BILLED")
                    .orElseThrow(() -> new RuntimeException("El estado de la factura no existe"));
                break;
        
            default:
                break;
        }
        invoice.setInvoiceState(invoiceState);

        invoice.setTypeInvoice(typeInvoice);
        invoice.setUser(user);
        invoice.setCompany(user.getCompany());

        if(invoiceRequest.getThirdParty() != null) {
            ThirdParty thirdParty = thirdPartyRepository.findByNitOrId(invoiceRequest.getThirdParty().getNit(), invoiceRequest.getThirdParty().getId())
                .orElseThrow(() -> new RuntimeException("El tercero no existe"));
            invoice.setThirdParty(thirdParty);
        }

        if(invoiceRequest.getInvoiceReference() != null) {
            Invoices invoiceReference = invoiceRepository.findById(invoiceRequest.getInvoiceReference())
                .orElseThrow(() -> new RuntimeException("La factura interna de referencia no existe"));
            invoice.setInvoiceReference(invoiceReference);
        }

        Invoices invoiceResolution = invoiceRepository.findTopByTypeInvoiceIdAndCompanyIdOrderByIdDesc(
            typeInvoice.getId(), user.getCompany().getId());
        String resolution = "1";
        if(invoiceResolution != null) {
            resolution = String.valueOf(Integer.parseInt(invoiceResolution.getResolution()) + 1);
        }
            
        invoice.setResolution(resolution);

        invoice.setResolutionInvoice(invoiceRequest.getHeader().getDocumentId());

        invoice.setInvoiceDate(
            invoiceRequest.getHeader().getIssueDate() != null ? invoiceRequest.getHeader().getIssueDate() : LocalDate.now()
        );
        invoice.setInvoiceDueDay(
            invoiceRequest.getHeader().getDueDate() != null ? invoiceRequest.getHeader().getDueDate() : LocalDate.now()
        );

        // Calcular totales
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalPayment = BigDecimal.ZERO;        

        if(invoiceRequest.getExchangeRate() != null) {
            ExchangeRate exchangeRate = exchangeRateService.exchangeRate(invoiceRequest.getExchangeRate());
            invoice.setExchangeRate(exchangeRate);
        }

        for (LineInvoiceRequest lineInvoice : invoiceRequest.getLineInvoices()) {
            Map<String, BigDecimal> totals = lineInvoiceService.calculateTotal(lineInvoice, invoice, userUtil);
            totalAmount = totalAmount.add(totals.get("totalAmount"));
            totalDiscount = totalDiscount.add(totals.get("totalDiscount"));
            totalTax = totalTax.add(totals.get("totalTax"));
            BigDecimal totalLine = totals.get("totalAmount").subtract(totals.get("totalDiscount")).add(totals.get("totalTax"));
            totalPayment = totalPayment.add(totalLine);
        }

        invoice.setTotalAmount(totalAmount);
        invoice.setTotalDiscount(totalDiscount);
        invoice.setTotalTax(totalTax);
        invoice.setTotalPayment(totalPayment);

        if(invoiceRequest.getTransaction() != null){
            if(invoiceRequest.getTransaction().getPaymentFormId() == 1){
                invoiceRequest.getTransaction().setDescription("Pago de factura " + typeInvoice.getCode() + "-" + formatNumber(resolution));
                invoiceRequest.getTransaction().setPaymentDate(invoice.getInvoiceDate());
                invoiceRequest.getTransaction().setValuePayment(invoice.getTotalPayment());
                invoice.setStatus(StatusesInvoices.PAID);
            }

            if(invoiceRequest.getTransaction().getPaymentFormId() != null) {
                PaymentForms paymentForm = paymentFormRepository.findById(invoiceRequest.getTransaction().getPaymentFormId())
                    .orElseThrow(() -> new RuntimeException("La forma de pago no existe"));
                invoice.setPaymentForms(paymentForm);
            }
        }

        invoice.setNotes(invoiceRequest.getNotes());

        Invoices invoiceSaved = invoiceRepository.save(invoice);
        
        for (LineInvoiceRequest lineInvoice : invoiceRequest.getLineInvoices()) {
            lineInvoiceService.createLineInvoice(lineInvoice, invoiceSaved, userUtil);
        }

        if(invoiceRequest.getTransaction() != null) {
            if(invoiceRequest.getTransaction().getPaymentFormId() == 1){
                invoiceRequest.getTransaction().setInvoiceId(invoiceSaved.getId());
                VouchersEntity voucher = voucherService.createVoucher(
                    invoiceRequest.getTransaction(),
                    1L
                );
            }
        }



        return invoiceSaved;
    }

    public String formatNumber(String number) {
        return String.format("%06d", Integer.parseInt(number));
    }

    @Transactional
    public List<InvoiceDTO> getInvoicesPage(DataTableRequest dtRequest) {
        User user = userUtil.getUser();
        int start = Math.max(0, dtRequest.getStart());
        int length = dtRequest.getLength();
        int safeLength = length <= 0 ? 20 : length;
        int page = start / safeLength;

        Pageable pageable = length == -1 ? Pageable.unpaged() : PageRequest.of(page, safeLength);

        Specification<Invoices> spec = dataTableSpecificationBuilder.build(dtRequest)
            .and((root, query, cb) -> cb.equal(root.get("company"), user.getCompany()))
            // .and((root, query, cb) -> cb.equal(root.get("typeInvoice").get("code"), "OC"))
            .and((root, query, cb) -> cb.isNull(root.get("deletedAt")))
            .and((root, query, cb) -> {
                query.orderBy(cb.desc(root.get("createdAt")));
                return cb.conjunction();
            });

        Page<Invoices> pageResult = invoiceRepository.findAll(spec, pageable);
        List<InvoiceDTO> invoicesDto = pageResult.getContent().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
        return invoicesDto;
    }

    @Transactional
    public Invoices updateInvoice(Long id, InvoiceRequest invoiceRequest){
        Invoices invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("La factura no existe"));

        if(invoice.getAccountingPeriod().getStatus().equals(AccountingPeriodStatus.CLOSED)) {
            throw new RuntimeException("El periodo contable no está abierto");
        }

        switch (invoice.getInvoiceState().getCode()) {
            case "REJECTED":
                throw new RuntimeException("Una vez rechazada, la orden de compra no puede ser actualizada"); 
            default:
                break;
        }

        if(invoice.getStatus().equals(StatusesInvoices.PAID)) {
            throw new RuntimeException("La factura no puede ser actualizada porque ya ha sido pagada");
        }

        // Calcular totales
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalPayment = BigDecimal.ZERO;

        if(invoiceRequest.getExchangeRate() != null) {
            ExchangeRate exchangeRate = exchangeRateService.exchangeRate(invoiceRequest.getExchangeRate());
            invoice.setExchangeRate(exchangeRate);
        }


        for (LineInvoiceRequest lineInvoice : invoiceRequest.getLineInvoices()) {
            if(lineInvoice.getIsDeleted()){
                lineInvoiceService.deleteLineInvoice(lineInvoice.getId());
            }else{
                lineInvoiceService.updateLineInvoice(lineInvoice.getId(), lineInvoice, invoice, userUtil);
            }
        }

        for (LinesInvoice lineInvoice : invoice.getLineInvoices()) {
            totalAmount = totalAmount.add(lineInvoice.getTotal());
            totalDiscount = totalDiscount.add(lineInvoice.getDiscount());
            totalTax = totalTax.add(lineInvoice.getTax());
            BigDecimal totalLine = totalAmount.subtract(totalDiscount).add(totalTax);
            totalPayment = totalPayment.add(totalLine);
        }

        invoice.setTotalAmount(totalAmount);
        invoice.setTotalDiscount(totalDiscount);
        invoice.setTotalTax(totalTax);
        invoice.setTotalPayment(totalPayment);

        if(!invoice.getInvoiceDueDay().equals(invoiceRequest.getHeader().getDueDate()) && invoiceRequest.getHeader().getDueDate() != null) {
            invoice.setInvoiceDueDay(invoiceRequest.getHeader().getDueDate());
        }

        if(!invoice.getInvoiceDate().equals(invoiceRequest.getHeader().getIssueDate()) && invoiceRequest.getHeader().getIssueDate() != null) {
            invoice.setInvoiceDate(invoiceRequest.getHeader().getIssueDate());
        }

        return invoiceRepository.save(invoice);
    }
    
    @Transactional
    public Invoices getInvoice(Long id) {

        Invoices invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("La factura no existe"));

        return invoice;
    }

    @Transactional
    public Invoices updateInvoiceState(Long id, StateUpdateRequest stateUpdateRequest) {
        Invoices invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("La factura no existe"));

        if(invoice.getAccountingPeriod().getStatus().equals(AccountingPeriodStatus.CLOSED)) {
            throw new RuntimeException("El periodo contable no está abierto");
        }
            
        switch (invoice.getTypeInvoice().getCode()) {
            case "OC":
                InvoiceStates invoiceState = invoiceStateRepository.findByBlockAndCode(stateUpdateRequest.getBlock(), stateUpdateRequest.getCode())
                    .orElseThrow(() -> new RuntimeException("El estado de la factura no existe"));

                switch (invoice.getInvoiceState().getCode()) {
                    case "PENDING_APPROVAL":
                        if(invoiceState.getCode().equals("APPROVED")) {
                            invoice.setInvoiceState(invoiceState);
                        }else if(invoiceState.getCode().equals("REJECTED")) {
                            invoice.setInvoiceState(invoiceState);
                            invoice.setObservations(stateUpdateRequest.getObservations());
                        }else{
                            throw new RuntimeException("El estado que se intenta asignar no es válido");
                        }
                        break;
                    case "REJECTED":
                        throw new RuntimeException("Una vez rechazada, la orden de compra no puede ser actualizada");
                
                    default:
                        break;
                }
                
                invoice.setInvoiceState(invoiceState);
                break;
        
            default:
                break;
        }
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void validateState(Long id){
        Invoices invoice = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("La factura no existe"));

        if(invoice.getAccountingPeriod().getStatus().equals(AccountingPeriodStatus.CLOSED)) {
            throw new RuntimeException("El periodo contable no está abierto");
        }

        BigDecimal totalPayment = invoice.getTotalPayment();
        BigDecimal totalPayments = voucherRepository.sumVouchersByInvoiceId(invoice.getId());

        if(totalPayments.compareTo(totalPayment) == 0) {
            invoice.setStatus(StatusesInvoices.PAID);
        }else{
            invoice.setStatus(StatusesInvoices.PENDING);
        }
        invoiceRepository.save(invoice);
    }
    
    // DTOS

    public InvoiceDTO toDto(Invoices invoice) {

        return InvoiceDTO.builder()
            .header(Header.builder()
                .id(invoice.getId())
                .DocumentId(invoice.getResolutionInvoice())
                .prefix(invoice.getTypeInvoice().getCode())
                .serial(invoice.getResolution())
                .type(Type.builder()
                    .id(invoice.getTypeInvoice().getId())
                    .code(invoice.getTypeInvoice().getCode())
                    .codeNumber(invoice.getTypeInvoice().getCodeNumber())
                    .name(invoice.getTypeInvoice().getName())
                    .build())
                .issueDate(invoice.getInvoiceDate())
                .dueDate(invoice.getInvoiceDueDay())
                .status(invoice.getStatus())
                .build())
            .state(State.builder()
                .id(invoice.getInvoiceState().getId())
                .name(invoice.getInvoiceState().getName())
                .code(invoice.getInvoiceState().getCode())
                .color(invoice.getInvoiceState().getColor())
                .description(invoice.getInvoiceState().getDescription())
                .build())
            .values(Values.builder()
                .totalPayment(invoice.getTotalPayment())
                .totalAmount(invoice.getTotalAmount())
                .totalDiscount(invoice.getTotalDiscount())
                .totalTax(invoice.getTotalTax())
                .build())
            .thirdParty(ThirdPartyDTO.builder()
                .id(invoice.getThirdParty().getId())
                .nit(invoice.getThirdParty().getNit())
                .businessName(invoice.getThirdParty().getBusinessName())
                .currencyType(CurrencyTypeResponseDTO.builder()
                    .isoCode(invoice.getThirdParty().getCurrencyType().getIsoCode())
                    .build())
                .build())
            .transaction(Transaction.builder()
                .paymentFormId(invoice.getPaymentForms().getId())
                .build())
            .exchangeRate( invoice.getExchangeRate() != null ? com.sigcon.backend.invoices.application.responses.dataInvoices.ExchangeRate.builder()
                .id(invoice.getExchangeRate().getId())
                .value(invoice.getExchangeRate().getValue())
                .currencyChanged(invoice.getExchangeRate().getCurrencyExchange().getIsoCode())
                .currencyChangedTo(invoice.getExchangeRate().getCurrencyExchanged().getIsoCode())
                .build() : null)
            .notes(invoice.getNotes())
            .lineInvoices(toLineInvoices(invoice.getLineInvoices(), invoice))
            .invoicesReferences(invoice.getInvoicesReferences().stream()
                .map(this::toDto)
                .collect(Collectors.toList()))
            .vouchers(toVouchers(invoice.getVouchers()))
            .build();
    }

    public LineInvoice toLineInvoice(LinesInvoice lineInvoice, Invoices invoice) {

        BigDecimal stock = lineInvoice.getQuantity();
        Boolean isStockeable = false;
        switch (invoice.getTypeInvoice().getCode()) {
            case "OC":
                if(!invoice.getInvoiceState().getCode().equals("PENDING_APPROVAL")) {
                    isStockeable = true;
                    if(invoice.getInvoicesReferences() != null) {
                        for(Invoices invoiceReference : invoice.getInvoicesReferences()) {
                            for(LinesInvoice lineInvoiceReference : invoiceReference.getLineInvoices()) {
                                if(lineInvoice.getProduct().getId().equals(lineInvoiceReference.getProduct().getId())) {
                                    stock = stock.subtract(lineInvoiceReference.getQuantity());
                                }
                            }
                        }
                    }
                }
                break;
            case "FC":
            case "FV":
                if (lineInvoice.getProduct() != null && lineInvoice.getProduct().getStock() != null) {
                    isStockeable = true;
                    stock = lineInvoice.getProduct().getStock();
                }
                break;
            default:
                break;
        }

        return LineInvoice.builder()
            .id(lineInvoice.getId())
            .name(lineInvoice.getName())
            .code(lineInvoice.getCode())
            .description(lineInvoice.getDescription())
            .quantity(lineInvoice.getQuantity())
            .price(lineInvoice.getPrice())
            .product(lineInvoice.getProduct() != null ? ProductResponse.builder()
                .id(lineInvoice.getProduct().getId())
                .name(lineInvoice.getProduct().getName())
                .description(lineInvoice.getProduct().getDescription())
                .code(lineInvoice.getProduct().getCode())
                .price(lineInvoice.getProduct().getPrice())
                .salePrice(lineInvoice.getProduct().getSalePrice())
                .stock(isStockeable ? stock : null)
                .build() : null)
            .discount(lineInvoice.getDiscountLine() != null ? Discounts.builder()
                .value(lineInvoice.getDiscountLine().getValue())
                .percentage(lineInvoice.getDiscountLine().getPercentage())
                .build() : null)
            .build();
    }

    public List<LineInvoice> toLineInvoices(List<LinesInvoice> lineInvoices, Invoices invoice) {
        return lineInvoices.stream()
            .map(lineInvoice -> toLineInvoice(lineInvoice, invoice))
            .collect(Collectors.toList());
    }

    public VoucherDTO toVoucher(VouchersEntity voucher) {
        return VoucherDTO.builder()
            .id(voucher.getId())
            .bankAccount(voucher.getBankAccount() != null ? BankAccountDTO.builder()
                .id(voucher.getBankAccount().getId())
                .accountName(voucher.getBankAccount().getAccountName())
                .accountNumberMasked(voucher.getBankAccount().getAccountNumber())
                .build() : null)
            .cashAccount(voucher.getCash() != null ? CashDTO.builder()
                .id(voucher.getCash().getId())
                .cashName(voucher.getCash().getCashName())
                .build() : null)
            .check(voucher.getCheck() != null ? CheckDTO.builder()
                .id(voucher.getCheck().getId())
                .numberCheck(voucher.getCheck().getNumberCheck())
                .build() : null)
            .number(voucher.getNumber())
            .date(voucher.getDate())
            .amount(voucher.getAmount())
            .description(voucher.getDescription())
            .reference(voucher.getReference() != null ? voucher.getReference() : null)
            .file(voucher.getFile() != null ? voucher.getFile() : null)
            .paymentMethod(PaymentMethodDTO.builder()
                .id(voucher.getPaymentMethod().getId())
                .name(voucher.getPaymentMethod().getName())
                .code(voucher.getPaymentMethod().getCode())
                .build())
            .build();
    }

    public List<VoucherDTO> toVouchers(List<VouchersEntity> vouchers) {
        return vouchers.stream()
            .map(this::toVoucher)
            .collect(Collectors.toList());
    }
}
