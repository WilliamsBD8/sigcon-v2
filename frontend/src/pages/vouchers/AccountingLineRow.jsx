import { memo } from 'react';
import InputSelectModal from '../../components/molecules/inputSelectModal';
import InputModal from '../../components/molecules/InputModal';

const LINE_TYPES = [
    { id: 'DEBIT', name: 'Débito' },
    { id: 'CREDIT', name: 'Crédito' },
];

const AccountingLineRow = ({
    index,
    line,
    lineType,
    accountOptions,
    disabled,
    onTypeChange,
    onAccountChange,
    onAmountChange,
    onRemove,
}) => {
    const selectedAccountLabel = accountOptions.find(
        (opt) => String(opt.id) === String(line.accountingAccountCode)
    )?.name;

    return (
        <div className="row g-2 align-items-end mb-3">
            <div className="col-md-3">
                <InputSelectModal
                    id={`voucher-line-type-${index}`}
                    label="Tipo"
                    placeholder="Tipo de línea"
                    labelOption={lineType === 'DEBIT' ? 'Débito' : 'Crédito'}
                    options={LINE_TYPES}
                    value={lineType}
                    onChange={onTypeChange}
                    required
                    error={false}
                    disabled={disabled}
                />
            </div>
            <div className="col-md-6">
                <InputSelectModal
                    id={`voucher-line-account-${index}`}
                    label="Cuenta contable"
                    placeholder={accountOptions.length ? 'Seleccione cuenta' : 'Cargando cuentas...'}
                    labelOption={selectedAccountLabel || line.accountingAccountCode}
                    options={accountOptions}
                    value={line.accountingAccountCode}
                    onChange={onAccountChange}
                    required
                    error={false}
                    disabled={accountOptions.length === 0}
                    clearable
                />
            </div>
            <div className="col-md-2">
                <InputModal
                    type="number"
                    id={`voucher-line-amount-${index}`}
                    label="Monto"
                    placeholder="0"
                    min="0"
                    value={line.amount ?? 0}
                    onChange={(e) => onAmountChange(Number(e.target.value))}
                    required
                    error={false}
                    disabled={disabled}
                />
            </div>
            {!disabled && (
                <div className="col-md-1 d-flex align-items-center pb-1">
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-text-danger"
                        onClick={onRemove}
                        title="Quitar línea"
                    >
                        <i className="ri-delete-bin-line" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default memo(AccountingLineRow);
