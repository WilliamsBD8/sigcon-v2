import { useEffect, useState } from 'react';
import InputSelectModal from '../../components/molecules/inputSelectModal';
import InputDate from '../../components/molecules/InputDate';
import TextareaModal from '../../components/molecules/TextareaModal';
import InputModal from '../../components/molecules/InputModal';
import InputDropFile from '../../components/molecules/InputDropFile';
import AlertPage from '../../components/molecules/AlertPage';
import AccountingLinesEditor from './AccountingLinesEditor';
import { fetchHelper } from '../../utils/fetch';
import { base_url } from '../../utils/functions';
import {
    getCounterpartMovementLabel,
    getTreasuryMovementLabel,
    isStandaloneVoucherType,
    needsManualAccountingLines,
    requiresEmployeeThirdParty,
} from './voucherUtils';

const VoucherFormModal = ({
    modalRef,
    voucher,
    setVoucher,
    voucherTypes,
    paymentMethods,
    cashPayments,
    checkBooks,
    checks,
    bankAccounts,
    error,
    isSending,
    onSave,
    readOnly = false,
    type
}) => {
    const selectedType = voucherTypes.find((t) => t.id === voucher?.voucherTypeId)
        ?? voucherTypes.find((t) => t.code === voucher?.voucherTypeCode);

    const typeCode = selectedType?.code ?? voucher?.voucherTypeCode;
    const showAccountingLines = needsManualAccountingLines(selectedType, voucher?.invoiceId, voucher?.voucherTypeCode);
    const standaloneMode = !voucher?.invoiceId && isStandaloneVoucherType(typeCode);
    const showEmployeeSelect = requiresEmployeeThirdParty(typeCode);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        if (!showEmployeeSelect) {
            setEmployees([]);
            return;
        }
        const loadEmployees = async () => {
            try {
                const res = await fetchHelper.get(
                    `${base_url(['api', 'v1', 'vouchers', 'third-parties'])}?role=EMPLEADO`,
                    {},
                    0,
                    false
                );
                setEmployees((res?.data ?? []).map((e) => ({
                    id: e.id,
                    name: e.label ?? `${e.businessName} — NIT ${e.nit}`,
                })));
            } catch {
                setEmployees([]);
            }
        };
        loadEmployees();
    }, [showEmployeeSelect]);

    const onTypeChange = (typeId) => {
        const type = voucherTypes.find((t) => String(t.id) === String(typeId));
        const manualLines = needsManualAccountingLines(type, voucher?.invoiceId);
        setVoucher({
            ...voucher,
            voucherTypeId: type?.id ?? null,
            voucherTypeCode: type?.code ?? null,
            thirdPartyId: requiresEmployeeThirdParty(type?.code) ? voucher.thirdPartyId : null,
            thirdParty: requiresEmployeeThirdParty(type?.code) ? voucher.thirdParty : null,
            lines: [],
        });
    };

    return (
        <div className="modal fade" ref={modalRef} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">
                            <i className="ri-receipt-line me-2" />
                            {readOnly ? 'Detalle del comprobante' : voucher?.id ? 'Editar comprobante' : 'Nuevo comprobante'}
                        </h4>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" />
                    </div>
                    <div className="modal-body">
                        {error?.show && (
                            <AlertPage
                                message={error.message}
                                type={error.type}
                                show={error.show}
                                duration={0}
                                html={false}
                                onChange={() => {}}
                            />
                        )}

                        <div className="row">
                            <div className="col-md-6 mb-2">
                                <InputSelectModal
                                    id={`voucherTypeId-${type}`}
                                    label="Tipo de comprobante"
                                    placeholder="Seleccione el tipo"
                                    labelOption="Seleccione el tipo"
                                    options={voucherTypes.map((t) => ({
                                        id: t.id,
                                        name: `${t.name}`,
                                    }))}
                                    value={voucher?.voucherTypeId}
                                    onChange={onTypeChange}
                                    required
                                    error={false}
                                    disabled={readOnly || !!voucher?.invoiceId}
                                />
                                {selectedType?.description && (
                                    <small className="text-muted d-block">{selectedType.description}</small>
                                )}
                            </div>
                            <div className="col-md-6 mb-2">
                                <InputModal
                                    type="number"
                                    id={`valuePayment-${type}`}
                                    label="Monto"
                                    placeholder="Ingrese el monto"
                                    value={voucher?.valuePayment ?? 0}
                                    onChange={(e) => {
                                        const amount = Number(e.target.value) || 0;
                                        const syncLines = showAccountingLines && (voucher?.lines?.length ?? 0) > 0
                                            ? voucher.lines.map((line) => ({ ...line, amount }))
                                            : voucher?.lines;
                                        setVoucher({ ...voucher, valuePayment: amount, lines: syncLines ?? voucher?.lines });
                                    }}
                                    required
                                    error={false}
                                    disabled={readOnly}
                                />
                            </div>

                            {showEmployeeSelect && (
                                <div className="col-12 mb-2">
                                    <InputSelectModal
                                        id={`thirdPartyId-${type}`}
                                        label="Empleado"
                                        placeholder="Seleccione el empleado"
                                        labelOption="thirdPartyId"
                                        options={employees}
                                        value={voucher?.thirdPartyId}
                                        onChange={(value) => {
                                            const emp = employees.find((e) => String(e.id) === String(value));
                                            setVoucher({
                                                ...voucher,
                                                thirdPartyId: value,
                                                thirdParty: emp
                                                    ? { id: emp.id, name: emp.name }
                                                    : null,
                                            });
                                        }}
                                        required
                                        error={false}
                                        disabled={readOnly || employees.length === 0}
                                    />
                                    {!readOnly && employees.length === 0 && (
                                        <small className="text-warning">
                                            No hay terceros con rol EMPLEADO registrados.
                                        </small>
                                    )}
                                </div>
                            )}

                            {readOnly && (voucher?.thirdParty?.name || voucher?.thirdParty?.businessName) && (
                                <div className="col-12 mb-2">
                                    <label className="form-label">Empleado</label>
                                    <p className="mb-0 fw-medium">
                                        {voucher.thirdParty.name || voucher.thirdParty.businessName}
                                    </p>
                                </div>
                            )}

                            {standaloneMode && typeCode && (
                                <div className="col-12 mb-1">
                                    <h6 className="text-primary mb-0 small text-uppercase">
                                        {getTreasuryMovementLabel(typeCode)}
                                    </h6>
                                </div>
                            )}

                            <div className="col-md-6 mb-2">
                                <InputSelectModal
                                    id={`paymentMethodId-${type}`}
                                    label="Método de pago"
                                    placeholder="Seleccione método"
                                    labelOption="paymentMethodId"
                                    options={paymentMethods}
                                    value={voucher?.methodPaymentId}
                                    onChange={(value) => setVoucher({ ...voucher, methodPaymentId: value })}
                                    required
                                    error={false}
                                    disabled={readOnly || paymentMethods.length === 0}
                                />
                            </div>
                            <div className="col-md-6 mb-2">
                                <InputDate
                                    id={`paymentDate-${type}`}
                                    label="Fecha"
                                    dateFormat="Y-m-d"
                                    placeholder="Fecha del comprobante"
                                    date={voucher?.paymentDate}
                                    onChange={(value) => setVoucher({ ...voucher, paymentDate: value })}
                                    required
                                    error={false}
                                    disabled={readOnly}
                                />
                            </div>

                            {voucher?.methodPaymentId && (
                                <>
                                    {String(voucher.methodPaymentId) === '1' && (
                                        <div className="col-12 mb-2">
                                            <InputSelectModal
                                                id={`cashPaymentId-${type}`}
                                                label="Cuenta de caja"
                                                placeholder="Seleccione caja"
                                                labelOption={
                                                    cashPayments.find((c) => String(c.id) === String(voucher?.cashAccount?.id))?.name
                                                }
                                                options={cashPayments}
                                                value={voucher?.cashAccount?.id}
                                                onChange={(value) => setVoucher({ ...voucher, cashAccount: { id: value, accountNumber: null }, bankAccount: null, check: null })}
                                                required
                                                error={false}
                                                disabled={readOnly || cashPayments.length === 0}
                                            />
                                        </div>
                                    )}
                                    {String(voucher.methodPaymentId) === '2' && (
                                        <div className="col-12 mb-2">
                                            <InputSelectModal
                                                id={`checkbookId-${type}`}
                                                label="Chequera"
                                                placeholder="Seleccione chequera"
                                                labelOption={
                                                    checkBooks.find((c) => String(c.id) === String(voucher?.check?.checkbookId))?.name
                                                }
                                                options={checkBooks}
                                                value={voucher?.check?.checkbookId}
                                                onChange={(value) => setVoucher({ ...voucher, check: { checkbookId: value, numberCheck: null, id: null }, bankAccount: null, cashAccount: null })}
                                                required
                                                error={false}
                                                disabled={readOnly || checkBooks.length === 0}
                                            />
                                        </div>
                                    )}
                                    {String(voucher.methodPaymentId) === '3' && (
                                        <div className="col-12 mb-2">
                                            <InputSelectModal
                                                id={`checkId-${type}`}
                                                label="Cheque"
                                                placeholder="Seleccione cheque"
                                                labelOption={
                                                    checks.find((c) => String(c.id) === String(voucher?.check?.id))?.name
                                                }
                                                options={checks}
                                                value={voucher?.check?.id}
                                                onChange={(value) => setVoucher({ ...voucher, check: { id: value, numberCheck: null, checkbookId: null }, bankAccount: null, cashAccount: null })}
                                                required
                                                error={false}
                                                disabled={readOnly || checks.length === 0}
                                            />
                                        </div>
                                    )}
                                    {!['1', '2', '3'].includes(String(voucher.methodPaymentId)) && (
                                        <div className="col-12 mb-2">
                                            <InputSelectModal
                                                id={`bankAccountId-${type}`}
                                                label="Cuenta bancaria"
                                                placeholder="Seleccione cuenta"
                                                labelOption={
                                                    bankAccounts.find((b) => String(b.id) === String(voucher?.bankAccount?.id))?.name
                                                }
                                                options={bankAccounts.filter((d) => d.type === (
                                                    String(voucher.methodPaymentId) === '4' ? 'CORRIENTE'
                                                        : String(voucher.methodPaymentId) === '5' ? 'AHORROS'
                                                            : 'TARJETA_CREDITO'
                                                ))}
                                                value={voucher?.bankAccount?.id}
                                                onChange={(value) => setVoucher({ ...voucher, bankAccount: { id: value, accountNumber: null }, cashAccount: null, check: null })}
                                                required
                                                error={false}
                                                disabled={readOnly || bankAccounts.length === 0}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="col-12 mb-2">
                                <TextareaModal
                                    id={`description-${type}`}
                                    label="Descripción"
                                    value={voucher?.description ?? ''}
                                    onChange={(value) => setVoucher({ ...voucher, description: value?.target?.value ?? value })}
                                    error={false}
                                    placeholder="Descripción del comprobante"
                                    disabled={readOnly}
                                />
                            </div>

                            {voucher.voucherTypeCode === 'SERVICE_PAYMENT' || voucher.voucherTypeCode === 'SERVICE_RECEIPT' && (
                                <div className="col-12 mb-2">
                                    <AccountingLinesEditor
                                        voucherTypeCode={typeCode}
                                        lines={voucher?.lines ?? []}
                                        onChange={(lines) => setVoucher({ ...voucher, lines })}
                                        disabled={readOnly}
                                        standaloneMode={standaloneMode}
                                        counterpartLabel={getCounterpartMovementLabel()}
                                    />
                                </div>
                            )}

                            {!readOnly && (
                                <div className="col-12 mb-2">
                                    <InputDropFile
                                        id={`file-${type}`}
                                        label="Soporte documental"
                                        placeholder="Adjuntar archivo (PDF, imagen, etc.)"
                                        value={voucher?.file}
                                        uploadUrl={null}
                                        onChange={(value) => setVoucher({ ...voucher, file: value })}
                                    />
                                </div>
                            )}

                            {readOnly && voucher?.file?.name && (
                                <div className="col-12 mb-2">
                                    <label className="form-label">Soporte documental</label>
                                    <p className="mb-0 small text-muted">
                                        <i className="ri-attachment-2 me-1" />
                                        {voucher.file.name}
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                            {readOnly ? 'Cerrar' : 'Cancelar'}
                        </button>
                        {!readOnly && (
                            <button type="button" className="btn btn-primary" onClick={onSave} disabled={isSending}>
                                {isSending ? 'Guardando...' : 'Guardar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoucherFormModal;
