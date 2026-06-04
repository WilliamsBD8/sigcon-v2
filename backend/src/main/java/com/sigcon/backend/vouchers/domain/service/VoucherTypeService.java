package com.sigcon.backend.vouchers.domain.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sigcon.backend.vouchers.application.VoucherTypeDTO;
import com.sigcon.backend.vouchers.domain.models.VoucherTypesEntity;
import com.sigcon.backend.vouchers.domain.repository.VoucherTypeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VoucherTypeService {

    private final VoucherTypeRepository voucherTypeRepository;
    private final VoucherAccountingAccountFilterService accountingAccountFilterService;

    public List<VoucherTypeDTO> listTypes(Boolean standaloneOnly) {
        return voucherTypeRepository.findAll().stream()
                .map(this::toDto)
                .filter(dto -> !Boolean.TRUE.equals(standaloneOnly) || dto.isStandaloneEligible())
                .toList();
    }

    public VoucherTypeDTO toDto(VoucherTypesEntity entity) {
        String code = entity.getCode();
        return VoucherTypeDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(code)
                .description(entity.getDescription())
                .autoAccountingWithInvoice(accountingAccountFilterService.usesAutoAccountingWithInvoice(code))
                .requiresManualAccountingLines(
                        accountingAccountFilterService.requiresManualAccountingLines(code, null))
                .standaloneEligible(isStandaloneEligible(code))
                .build();
    }

    private boolean isStandaloneEligible(String code) {
        return accountingAccountFilterService.requiresManualAccountingLines(code, null)
                && !accountingAccountFilterService.usesAutoAccountingWithInvoice(code);
    }
}
