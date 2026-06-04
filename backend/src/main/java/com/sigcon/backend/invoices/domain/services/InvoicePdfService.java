package com.sigcon.backend.invoices.domain.services;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.itextpdf.layout.element.Paragraph;
import com.sigcon.backend.invoices.application.responses.InvoiceDTO;
import com.sigcon.backend.invoices.application.responses.LineInvoice;
import com.sigcon.backend.reports.domain.service.ReportPdfService;
import com.sigcon.backend.utils.UserUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {

    private final InvoiceService invoiceService;
    private final ReportPdfService reportPdfService;
    private final UserUtil userUtil;

    public byte[] generatePdf(Long invoiceId) throws IOException {
        InvoiceDTO invoice = invoiceService.toDto(invoiceService.getInvoice(invoiceId));
        userUtil.getUser();

        String typeCode = invoice.getHeader().getType().getCode();
        String resolution = invoice.getHeader().getSerial() != null
                ? invoice.getHeader().getSerial()
                : "";
        String documentCode = typeCode + "-" + String.format("%05d", parseSerial(resolution));

        String title = invoice.getHeader().getType().getName() + " — " + documentCode;
        List<Paragraph> body = buildBody(invoice, documentCode);

        return reportPdfService.generateReport(title, body);
    }

    private List<Paragraph> buildBody(InvoiceDTO invoice, String documentCode) {
        List<Paragraph> paragraphs = new ArrayList<>();

        paragraphs.add(bodyLine("Documento: " + documentCode));
        paragraphs.add(bodyLine("Tercero: " + safe(invoice.getThirdParty().getBusinessName())));
        paragraphs.add(bodyLine("NIT: " + safe(invoice.getThirdParty().getNit())
                + (invoice.getThirdParty().getDv() != null ? "-" + invoice.getThirdParty().getDv() : "")));
        paragraphs.add(bodyLine("Fecha: " + safeDate(invoice.getHeader().getDueDate())));
        if (invoice.getHeader().getIssueDate() != null) {
            paragraphs.add(bodyLine("Vencimiento / emisión: " + invoice.getHeader().getIssueDate()));
        }
        if (invoice.getState() != null) {
            paragraphs.add(bodyLine("Estado: " + invoice.getState().getName()));
        }
        paragraphs.add(bodyLine(" "));

        paragraphs.add(sectionTitle("Detalle de ítems"));
        if (invoice.getLineInvoices() == null || invoice.getLineInvoices().isEmpty()) {
            paragraphs.add(bodyLine("Sin ítems registrados."));
        } else {
            int index = 1;
            for (LineInvoice line : invoice.getLineInvoices()) {
                BigDecimal subtotal = line.getPrice().multiply(line.getQuantity());
                paragraphs.add(bodyLine(
                        index + ". " + safe(line.getName())
                                + " | Cant: " + line.getQuantity()
                                + " | Precio: " + formatMoney(line.getPrice())
                                + " | Subtotal: " + formatMoney(subtotal)
                ));
                index++;
            }
        }

        paragraphs.add(bodyLine(" "));
        paragraphs.add(sectionTitle("Totales"));
        if (invoice.getValues() != null) {
            paragraphs.add(bodyLine("Subtotal: " + formatMoney(invoice.getValues().getTotalAmount())));
            paragraphs.add(bodyLine("Descuento: " + formatMoney(invoice.getValues().getTotalDiscount())));
            paragraphs.add(bodyLine("Impuesto: " + formatMoney(invoice.getValues().getTotalTax())));
            paragraphs.add(bodyLine("Total a pagar: " + formatMoney(invoice.getValues().getTotalPayment())));
        }

        if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
            paragraphs.add(bodyLine(" "));
            paragraphs.add(sectionTitle("Notas"));
            paragraphs.add(bodyLine(invoice.getNotes()));
        }

        if (invoice.getVouchers() != null && !invoice.getVouchers().isEmpty()) {
            paragraphs.add(bodyLine(" "));
            paragraphs.add(sectionTitle("Comprobantes de pago"));
            invoice.getVouchers().forEach(v -> paragraphs.add(bodyLine(
                    "N° " + v.getNumber() + " — " + safeDate(v.getDate())
                            + " — " + formatMoney(v.getAmount())
                            + (v.getDescription() != null ? " — " + v.getDescription() : "")
            )));
        }

        return paragraphs;
    }

    private Paragraph bodyLine(String text) {
        return new Paragraph(text).setFontSize(10).setMarginBottom(4);
    }

    private Paragraph sectionTitle(String text) {
        return new Paragraph(text).setBold().setFontSize(11).setMarginBottom(6);
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String safeDate(Object date) {
        return date != null ? date.toString() : "";
    }

    private String formatMoney(BigDecimal value) {
        if (value == null) {
            return "0";
        }
        return value.toPlainString();
    }

    private long parseSerial(String serial) {
        try {
            return Long.parseLong(serial.replaceAll("\\D", ""));
        } catch (Exception e) {
            return 0L;
        }
    }
}
