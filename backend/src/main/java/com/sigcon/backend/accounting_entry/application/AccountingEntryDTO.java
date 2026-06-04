package com.sigcon.backend.accounting_entry.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AccountingEntryDTO {
    private Long id;
    private Long voucherId;
    private String description;
    private BigDecimal credit;
    private BigDecimal debit;
    private List<AccountingEntryLineDTO> lines;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
