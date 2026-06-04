import { useCallback, useEffect, useState } from 'react';
import { fetchHelper } from '../../utils/fetch';
import { base_url } from '../../utils/functions';
import { isStandaloneVoucherType } from './voucherUtils';
import AccountingLineRow from './AccountingLineRow';

const AccountingLinesEditor = ({
    voucherTypeCode,
    lines = [],
    onChange,
    disabled = false,
    standaloneMode = false,
    counterpartLabel = null,
}) => {
    const [accountsByLine, setAccountsByLine] = useState({});

    const loadAccounts = useCallback(async (lineType, lineIndex) => {
        if (!voucherTypeCode || !lineType) return;
        const url = base_url(['api', 'v1', 'vouchers', 'accounting-accounts', 'filter']);
        const response = await fetchHelper.post(
            url,
            {
                voucherTypeCode,
                lineType,
                excludeTreasuryAccounts: standaloneMode || isStandaloneVoucherType(voucherTypeCode),
            },
            {},
            0,
            false
        );
        const options = (response?.data ?? []).map((account) => ({
            id: account.code,
            name: account.label,
        }));
        setAccountsByLine((prev) => ({ ...prev, [`${lineIndex}-${lineType}`]: options }));
    }, [voucherTypeCode, standaloneMode]);

    useEffect(() => {
        lines.forEach((line, index) => {
            if (line?.type) {
                loadAccounts(line.type, index);
            }
        });
    }, [voucherTypeCode, lines, loadAccounts]);

    const updateLine = (index, field, value) => {
        const next = lines.map((line, i) => (i === index ? { ...line, [field]: value } : line));
        if (field === 'type') {
            loadAccounts(value, index);
            next[index].accountingAccountCode = null;
        }
        onChange(next);
    };

    const addLine = () => {
        onChange([
            ...lines,
            { accountingAccountCode: null, type: 'DEBIT', amount: 0 },
        ]);
    };

    const removeLine = (index) => {
        onChange(lines.filter((_, i) => i !== index));
    };

    const totals = lines.reduce(
        (acc, line) => {
            const amount = Number(line.amount) || 0;
            if (line.type === 'DEBIT') acc.debit += amount;
            if (line.type === 'CREDIT') acc.credit += amount;
            return acc;
        },
        { debit: 0, credit: 0 }
    );

    if (!voucherTypeCode) {
        return (
            <div className="alert alert-info py-2 mb-0">
                Seleccione primero el tipo de comprobante para cargar las cuentas contables permitidas.
            </div>
        );
    }

    return (
        <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">{counterpartLabel || 'Líneas contables'}</h6>
                {!disabled && (
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLine}>
                        <i className="ri-add-line me-1" /> Agregar línea
                    </button>
                )}
            </div>

            {standaloneMode && (
                <p className="text-muted small mb-2">
                    Agregue una o más líneas en débito o crédito (sin cuentas 11/12 de banco o caja).
                    El movimiento de tesorería se registra automáticamente según el origen de pago de arriba.
                </p>
            )}

            {lines.length === 0 && !disabled && (
                <p className="text-muted small mb-2">
                    Use &quot;Agregar línea&quot; para registrar el detalle contable. Los totales deben cuadrar con el monto del comprobante.
                </p>
            )}

            {lines.map((line, index) => {
                const lineType = line.type ?? 'DEBIT';
                const accountOptions = accountsByLine[`${index}-${lineType}`] ?? [];

                return (
                    <AccountingLineRow
                        key={`voucher-accounting-line-${index}`}
                        index={index}
                        line={line}
                        lineType={lineType}
                        accountOptions={accountOptions}
                        disabled={disabled}
                        onTypeChange={(value) => updateLine(index, 'type', value)}
                        onAccountChange={(value) => updateLine(index, 'accountingAccountCode', value)}
                        onAmountChange={(value) => updateLine(index, 'amount', value)}
                        onRemove={() => removeLine(index)}
                    />
                );
            })}

            <div className="d-flex flex-wrap gap-3 small text-muted mt-2">
                <span>Total débito: <b>{totals.debit.toLocaleString('es-CO')}</b></span>
                <span>Total crédito: <b>{totals.credit.toLocaleString('es-CO')}</b></span>
                {standaloneMode && (
                    <span>
                        Neto (D − C): <b>{(totals.debit - totals.credit).toLocaleString('es-CO')}</b>
                    </span>
                )}
                {!standaloneMode && (
                    <span className={totals.debit === totals.credit ? 'text-success' : 'text-danger'}>
                        {totals.debit === totals.credit ? 'Cuadrado' : 'Descuadrado'}
                    </span>
                )}
            </div>
            {standaloneMode && (
                <p className="small text-success mb-0 mt-1">
                    <i className="ri-check-line me-1" />
                    Al guardar se añade la línea de banco/caja por el monto del comprobante.
                </p>
            )}
        </div>
    );
};

export default AccountingLinesEditor;
