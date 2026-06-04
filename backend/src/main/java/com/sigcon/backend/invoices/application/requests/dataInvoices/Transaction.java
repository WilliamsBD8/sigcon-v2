package com.sigcon.backend.invoices.application.requests.dataInvoices;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.sigcon.backend.accounting_entry.application.AccountingEntryLineRequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class Transaction {
    @Schema (description = "Valor de pago", example = "1000000")
    @NotNull(message = "El valor de pago es requerido")
    private BigDecimal valuePayment;

    @Schema (description = "Forma de pago", example = "01 - Contado, 02 - Crédito")
    private Long paymentFormId;

    @Schema (description = "Metodo de pago", example = "01 - Cuenta bancaria, 02 - Cuenta de caja, 03 - Cheque")
    @NotNull(message = "El metodo de pago es requerido")
    private Long methodPaymentId;

    @Schema (description = "Cuenta bancaria", example = "1234567890")
    private AccountBank bankAccount;

    @Schema (description = "Cuenta de caja", example = "1234567890")
    private AccountCash cashAccount;

    @Schema (description = "Cheque", example = "1234567890")
    private Check check;

    @Schema (description = "Fecha de pago", example = "2026-01-01")
    @NotNull(message = "La fecha de pago es requerida")
    private LocalDate paymentDate;

    @Schema (description = "Descripción", example = "Pago de factura")
    private String description;

    @Schema (description = "ID de la factura", example = "1234567890")
    private Long invoiceId;

    @Schema(description = "ID del tipo de comprobante", example = "1")
    @NotNull(message = "El tipo de comprobante es requerido")
    private Long voucherTypeId;

    @Schema(description = "ID del tercero asociado (ej. empleado en nómina)", example = "1")
    private Long thirdPartyId;

    @Schema(description = "Datos de la tasa de cambio", example = "{}")
    private ExchangeRate exchangeRate;

    @Schema (description = "Archivo en base64", example = "base64")
    private File file;

    @Schema (description = "Referencia", example = "1234567890")
    private String reference;

    @Schema (description = "Líneas de entrada y salida", example = "[]")
    private List<AccountingEntryLineRequest> lines;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountBank{
        
        @Schema (description = "ID de la cuenta bancaria", example = "1234567890")
        private Long id;

        @Schema (description = "Número de cuenta", example = "1234567890")
        private String accountNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountCash{
        
        @Schema (description = "ID de la cuenta de caja", example = "1234567890")
        private Long id;

        @Schema (description = "Número de cuenta", example = "1234567890")
        private String accountNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Check{
        
        @Schema (description = "ID del cheque", example = "1234567890")
        private Long id;

        @Schema (description = "ID de la chequera", example = "1234567890")
        private Long checkbookId;

        @Schema (description = "Número de cheque", example = "1234567890")
        private Integer numberCheck;
        
        @Schema (description = "Numero de la chequera", example = "1234567890")
        private String checkbookNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class File{   
        @Schema (description = "Archivo en base64", example = "base64")
        private String base64;

        @Schema (description = "Nombre del archivo", example = "archivo.pdf")
        private String name;
    }
}
