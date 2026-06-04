export const emptyVoucher = {
    id: null,
    voucherTypeId: null,
    voucherTypeCode: null,
    thirdPartyId: null,
    thirdParty: null,
    valuePayment: 0,
    paymentFormId: 1,
    methodPaymentId: null,
    bankAccount: null,
    cashAccount: null,
    check: null,
    paymentDate: null,
    description: '',
    file: null,
    reference: null,
    lines: [],
    invoiceId: null,
};

export const STANDALONE_VOUCHER_TYPES = ['PAYROLL', 'SERVICE_PAYMENT', 'SERVICE_RECEIPT'];

export const isStandaloneVoucherType = (code) => STANDALONE_VOUCHER_TYPES.includes(code);

export const isTreasuryAccountCode = (code) => {
    if (!code) return false;
    const c = String(code).trim();
    return c.startsWith('11') || c.startsWith('12');
};

/** Tipo de línea manual: débito en egresos, crédito en ingresos por servicios. */
export const getStandaloneCounterpartLineType = (voucherTypeCode) => (
    voucherTypeCode === 'SERVICE_RECEIPT' ? 'CREDIT' : 'DEBIT'
);

export const isOutflowVoucherType = (code) => code !== 'SERVICE_RECEIPT';

export const requiresEmployeeThirdParty = (code) => code === 'PAYROLL';

export const getTreasuryMovementLabel = (voucherTypeCode) => (
    isOutflowVoucherType(voucherTypeCode)
        ? 'Origen de pago (registra crédito en tesorería)'
        : 'Origen de pago (registra débito en tesorería)'
);

export const getCounterpartMovementLabel = () => 'Líneas contables de contrapartida';

export const needsManualAccountingLines = (voucherType, invoiceId = null, voucherTypeCode = null) => {
    if(voucherTypeCode === 'SERVICE_PAYMENT' || voucherTypeCode === 'SERVICE_RECEIPT') {
        return true;
    }
    if (!voucherType) return false;
    if (invoiceId != null && voucherType.autoAccountingWithInvoice) return false;
    return Boolean(voucherType.requiresManualAccountingLines);
};

export const validateAccountingLines = (lines = [], expectedAmount = null, voucherTypeCode = null) => {
    const standalone = isStandaloneVoucherType(voucherTypeCode);

    if (standalone) {
        if (!lines?.length) {
            return 'Registre al menos una línea contable de contrapartida.';
        }
        let debit = 0;
        let credit = 0;
        const outflow = isOutflowVoucherType(voucherTypeCode);
        for (const line of lines) {
            if (!line?.type || line.amount == null || Number(line.amount) <= 0) {
                return 'Indique tipo, cuenta y monto en cada línea.';
            }
            if (!line.accountingAccountCode) {
                return 'Seleccione la cuenta contable en cada línea.';
            }
            if (isTreasuryAccountCode(line.accountingAccountCode)) {
                return 'Las cuentas de banco o caja se definen arriba con el método de pago.';
            }
            if (line.type === 'DEBIT') debit += Number(line.amount) || 0;
            if (line.type === 'CREDIT') credit += Number(line.amount) || 0;
        }
        const net = outflow ? debit - credit : credit - debit;
        if (expectedAmount != null && net !== Number(expectedAmount)) {
            return 'El neto de las líneas manuales (débitos − créditos) debe igualar el monto del comprobante.';
        }
        return null;
    }

    if (!lines || lines.length < 2) {
        return 'Registre al menos dos líneas contables (débito y crédito).';
    }
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
        if (!line?.type || line.amount == null || Number(line.amount) <= 0) {
            return 'Cada línea debe tener tipo, cuenta y monto mayor a cero.';
        }
        if (!line.accountingAccountCode) {
            return 'Seleccione la cuenta contable en cada línea.';
        }
        const amount = Number(line.amount) || 0;
        if (line.type === 'DEBIT') debit += amount;
        if (line.type === 'CREDIT') credit += amount;
    }
    if (debit !== credit) {
        return 'El total débito debe ser igual al total crédito.';
    }
    if (expectedAmount != null && debit !== Number(expectedAmount)) {
        return 'El monto del comprobante debe coincidir con el total del asiento.';
    }
    return null;
};

export const mapVoucherToPayload = (voucher) => ({
    invoiceId: voucher.invoiceId ?? null,
    voucherTypeId: voucher.voucherTypeId ?? null,
    thirdPartyId: voucher.thirdPartyId ?? null,
    valuePayment: voucher.valuePayment,
    paymentFormId: voucher.paymentFormId,
    methodPaymentId: voucher.methodPaymentId,
    bankAccount: voucher.bankAccount,
    cashAccount: voucher.cashAccount,
    check: voucher.check,
    paymentDate: voucher.paymentDate,
    description: voucher.description,
    file: voucher.file,
    reference: voucher.reference,
    lines: voucher.lines ?? [],
});

export const mapDetailToForm = (detail) => ({
    id: detail.id,
    voucherTypeId: detail.voucherType?.id ?? null,
    voucherTypeCode: detail.voucherType?.code ?? null,
    valuePayment: detail.amount,
    paymentFormId: 1,
    methodPaymentId: detail.paymentMethod?.id ?? null,
    bankAccount: detail.bankAccount ? { id: detail.bankAccount.id, accountNumber: null } : null,
    cashAccount: detail.cashAccount ? { id: detail.cashAccount.id, accountNumber: null } : null,
    check: detail.check ?? null,
    paymentDate: detail.date,
    description: detail.description ?? '',
    file: detail.file ? { name: detail.file, base64: null } : null,
    reference: detail.reference ?? null,
    invoiceId: detail.invoiceId ?? null,
    thirdPartyId: detail.thirdParty?.id ?? null,
    thirdParty: detail.thirdParty
        ? {
            id: detail.thirdParty.id,
            name: detail.thirdParty.businessName,
            nit: detail.thirdParty.nit,
            dv: detail.thirdParty.dv,
        }
        : null,
    lines: (detail.accountingEntry?.lines ?? [])
        .filter((line) => !isTreasuryAccountCode(line.accountingAccount?.pucAccount?.code))
        .map((line) => ({
            accountingAccountCode: line.accountingAccount?.pucAccount?.code,
            type: line.type,
            amount: line.amount,
        })),
});
