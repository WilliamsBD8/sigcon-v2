package com.sigcon.backend.invoices.domain.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.sigcon.backend.invoices.application.responses.dataInvoices.State;
import com.sigcon.backend.invoices.domain.model.InvoiceStates;
import com.sigcon.backend.invoices.domain.repository.InvoiceStateRepository;
import com.sigcon.backend.parametrization.users.domain.model.User;
import com.sigcon.backend.utils.DataTableRequest;
import com.sigcon.backend.utils.DataTableSpecificationBuilder;
import com.sigcon.backend.utils.UserUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StateInvoiceService {

    private final InvoiceStateRepository invoiceStateRepository;
    private final UserUtil userUtil;

    private final DataTableSpecificationBuilder<InvoiceStates> dataTableSpecificationBuilder = new DataTableSpecificationBuilder<>();


    public List<InvoiceStates> getInvoiceStates(DataTableRequest dtRequest) {
        User user = userUtil.getUser();
        int start = Math.max(0, dtRequest.getStart());
        int length = dtRequest.getLength();
        int safeLength = length <= 0 ? 20 : length;
        int page = start / safeLength;

        Pageable pageable = length == -1 ? Pageable.unpaged() : PageRequest.of(page, safeLength);

        Specification<InvoiceStates> spec = dataTableSpecificationBuilder.build(dtRequest)
            .and((root, query, cb) -> cb.equal(root.get("block"), "OC"))
            .and((root, query, cb) -> cb.isNull(root.get("deletedAt")));

        Page<InvoiceStates> pageResult = invoiceStateRepository.findAll(spec, pageable);
        List<InvoiceStates> invoiceStates = pageResult.getContent();
        return invoiceStates;
    }

    // DTOS
    public State toDto(InvoiceStates invoiceState) {
        return State.builder()
            .id(invoiceState.getId())
            .name(invoiceState.getName())
            .code(invoiceState.getCode())
            .color(invoiceState.getColor())
            .description(invoiceState.getDescription())
            .build();
    }

    public List<State> toDtos(List<InvoiceStates> invoiceStates) {
        return invoiceStates.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

}
