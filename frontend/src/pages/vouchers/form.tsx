import InputSelectModal from "@/components/molecules/inputSelectModal";
import { VoucherTypeInterface } from "./interfaces/voucher.interfaces";
import InputDate from "@/components/molecules/InputDate";
import Input from "@/components/atoms/Input";
import InputModal from "@/components/molecules/InputModal";

import { LinesAccoountingInterface, PaymentInterface } from "../invoices/interfaces/payments.interface";
import { Fragment, memo, useEffect, useMemo, useState } from "react";
import TextareaModal from "@/components/molecules/TextareaModal";
import InputDropFile from "@/components/molecules/InputDropFile";
import AlertPage from "@/components/molecules/AlertPage";
import { uniqueId } from "lodash";

interface FormVoucherProps {
    closeFormVoucher: () => void;
    typesVouchers: any;
    paymentMethods: any;
    bankAccounts: any;
    cashAccounts: any;
    checks: any;
    thirdParties: any;
    accountingAccounts: any;
    voucher: PaymentInterface;
    setVoucher: (voucher: PaymentInterface) => void;
    setMessage: (message: any) => void;
}

const FormVoucher = ({
    closeFormVoucher,
    typesVouchers,
    paymentMethods,
    bankAccounts,
    cashAccounts,
    checks,
    thirdParties,
    accountingAccounts,
    voucher,
    setVoucher,
    setMessage,
}: FormVoucherProps) => {

    const [bankAccountsFiltered, setBankAccountsFiltered] = useState([]);
    const [accountingAccountsFiltered, setAccountingAccountsFiltered] = useState([]);
    const [thirdPartiesFiltered, setThirdPartiesFiltered] = useState([]);

    const [messageForm, setMessageForm] = useState({
        message: "",
        type: "",
        show: false,
        duration: 5000,
        html: false,
    });

    const typesLines = useMemo(() => {
        return [
            { id: 'DEBIT', name: 'Debito' },
            { id: 'CREDIT', name: 'Credito' },
        ]
    }, []);


    useEffect(() => {
        setAccountingAccountsFiltered([]);
        setThirdPartiesFiltered([]);
        if ([4, 5].includes(Number(voucher?.voucherType?.id))) {
            const voucherType = voucher?.voucherType?.id == 4 ? "51" : voucher?.voucherType?.id == 5 ? "41" : "";
            const accountings = accountingAccounts.filter((accountingAccount: any) => accountingAccount?.pucAccount?.code?.startsWith(voucherType))
            setAccountingAccountsFiltered(
                accountings.map((a: any) => ({
                    id: a.pucAccount.code,
                    label: a.pucAccount.code + ' - ' + a.customName
                }))
            );
        }

        switch (voucher?.voucherType?.id) {
            case 3:
                setThirdPartiesFiltered(thirdParties.filter((t:any) => t.roles.some((r:any) => r.name == "EMPLEADO")));
                break;
            case 4:
                setThirdPartiesFiltered(thirdParties.filter((t:any) => t.roles.some((r:any) => r.name == "PROVEEDOR")));
                break;
            case 5:
                setThirdPartiesFiltered(thirdParties.filter((t:any) => t.roles.some((r:any) => r.name == "CLIENTE")));
                break;
            default:
                setThirdPartiesFiltered([]);
                break;
        }

    }, [voucher?.voucherType]);

    useEffect(() => {
        setMessageForm({ ...messageForm, show: false });
        if(accountingAccountsFiltered.length === 0 && [4, 5].includes(Number(voucher?.voucherType?.id)) && voucher?.lines?.length === 0) {
            setMessageForm({
                message: "No se encontraron cuentas contables para el tipo de comprobante seleccionado",
                type: "danger",
                show: true,
                duration: 5000,
                html: false,
            });
        }

    }, [accountingAccountsFiltered, voucher?.voucherType]);

    useEffect(() => {
        if(voucher?.lines?.length > 0) {
            const lines = voucher?.lines.map((line: LinesAccoountingInterface) => line.accountingAccountCode);
            setAccountingAccountsFiltered(
                accountingAccountsFiltered.map((a: any) => ({
                    ...a,
                    disabled: lines.includes(a.id)
                }))
            );
        }
    }, [voucher?.lines])

    useEffect(() => {
        if (voucher?.methodPaymentId) {
            const paymentMethod = paymentMethods.find((paymentMethod: any) => paymentMethod.id == voucher?.methodPaymentId);
            console.log(paymentMethod);
            if (paymentMethod) {
                setBankAccountsFiltered(
                    bankAccounts.filter((bankAccount: any) => bankAccount?.accountType === paymentMethod?.code));
            }
        }
    }, [voucher?.methodPaymentId])

    return (
        <>
            {messageForm.show && (
                <AlertPage
                    key={"alert-form-vouchers"}
                    message={messageForm.message}
                    type={messageForm.type}
                    duration={messageForm.duration}
                    html={messageForm.html}
                    show={messageForm.show}
                    onChange={() => setMessageForm({ ...messageForm, show: false })}
                />
            )}
            <div className="row mb-4">
                <div className="col-12 col-md-6">
                    <InputSelectModal
                        id="voucherType"
                        label="Tipo de Comprobante"
                        value={voucher?.voucherType?.id}
                        onChange={(value: number) => {
                            const type = typesVouchers.find((type: VoucherTypeInterface) => type.id == value);
                            setVoucher({ ...voucher, voucherType: type })
                        }}
                        options={typesVouchers}
                        placeholder="Seleccione un tipo de comprobante"
                        required
                        multiple={false}
                        newOption={false}
                        error={null}
                    />
                </div>
                <div className="col-12 col-md-6">
                    <InputDate
                        id="paymentDate"
                        label="Fecha de Pago"
                        dateFormat="Y-m-d"
                        date={voucher?.paymentDate}
                        onChange={(value: string) => setVoucher({ ...voucher, paymentDate: value })}
                        error={null}
                        required
                        placeholder="Seleccione la fecha de pago"
                        disabled={false}
                    />
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-12 col-md-6">
                    <InputModal
                        type="number"
                        id="valuePayment"
                        label="Monto"
                        value={voucher?.valuePayment ?? 0}
                        onChange={(e: any) => setVoucher({ ...voucher, valuePayment: e.target.value })}
                        error={null}
                        required
                        placeholder="Ingrese el monto"
                        disabled={false}
                        maxLength={undefined}
                        inputMode={undefined}
                        pattern={undefined}
                        min={undefined}
                        max={undefined}
                    />
                </div>
                <div className="col-12 col-md-6">
                    <InputModal
                        type="text"
                        id="reference"
                        label="Referencia"
                        value={voucher?.reference ?? ''}
                        onChange={(e: any) => setVoucher({ ...voucher, reference: e.target.value })}
                        error={null}
                        required
                        placeholder="Ingrese la referencia"
                        disabled={false}
                        maxLength={undefined}
                        inputMode={undefined}
                        pattern={undefined}
                        min={undefined}
                        max={undefined}
                    />
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-12 col-md-6">
                    <InputSelectModal
                        id="paymentMethod"
                        label="Método de Pago"
                        value={voucher?.methodPaymentId}
                        onChange={(value: number) => {
                            setVoucher({ ...voucher, methodPaymentId: value })
                        }}
                        options={paymentMethods}
                        placeholder="Seleccione un método de pago"
                        required
                        multiple={false}
                        newOption={false}
                        error={null}
                    />
                </div>
                {
                    voucher?.methodPaymentId == 1 && ( // Efectivo
                        <div className="col-12 col-md-6">
                            <InputSelectModal
                                id="cashAccount"
                                label="Cuenta de caja"
                                value={voucher?.cashAccount?.id ?? null}
                                onChange={(value: number) => {
                                    setVoucher({ ...voucher, cashAccount: { id: value, accountNumber: null } })
                                }}
                                options={cashAccounts.map((c: any) => ({ label: `${c.cashName} - ${c.cashCode}`, id: c.id }))}
                                placeholder="Seleccione una cuenta de caja"
                                required
                                multiple={false}
                                newOption={false}
                                error={null}
                            />
                        </div>
                    ) || voucher?.methodPaymentId == 2 && ( // Cheque
                        <div className="col-12 col-md-6">
                            <InputSelectModal
                                id="check"
                                label="Cheque"
                                value={voucher?.check?.id ?? null}
                                onChange={(value: number) => {
                                    setVoucher({ ...voucher, check: { id: value, checkbookId: null, numberCheck: null, checkbookNumber: null } })
                                }}
                                options={checks.map((c: any) => ({ label: `${c.checkbook.checkbookNumber} - ${c.numberCheck}`, id: c.id }))}
                                placeholder="Seleccione un cheque"
                                required
                                multiple={false}
                                newOption={false}
                                error={null}
                            />
                        </div>
                    ) || voucher?.methodPaymentId && (
                        <div className="col-12 col-md-6">
                            <InputSelectModal
                                id="bankAccount"
                                label="Cuenta bancaria"
                                value={voucher?.bankAccount?.id ?? null}
                                onChange={(value: number) => {
                                    setVoucher({ ...voucher, bankAccount: { id: value, accountNumber: null } })
                                }}
                                options={bankAccountsFiltered.map((b: any) => ({
                                    label: `${b.accountName} - ${b.code}`,
                                    id: b.id
                                }))}
                                placeholder="Seleccione una cuenta bancaria"
                                required
                                multiple={false}
                                newOption={false}
                                error={null}
                            />
                        </div>
                    )
                }
            </div>

            <div className="row mb-4">
                <div className="col-12">
                    <InputSelectModal
                        id="thirdParty"
                        label="Tercero"
                        value={voucher?.thirdPartyId ?? null}
                        onChange={(value: number) => {
                            setVoucher({ ...voucher, thirdPartyId: value })
                        }}
                        options={thirdPartiesFiltered.map((t:any) => ({label: `${t.name} - ${t.code}`, id: t.id}))}
                        placeholder="Seleccione un tercero"
                        required
                        multiple={false}
                        newOption={false}
                        error={null}
                    />
                </div>
            </div>

            <div className="row">
                    <TextareaModal
                        id="description"
                        label=""
                        value={voucher?.description ?? ''}
                        onChange={(e: any) => setVoucher({ ...voucher, description: e.target.value })}
                        error={null}
                        required
                        placeholder="Ingrese la descripción"
                    />
            </div>

            {
                [4, 5].includes(Number(voucher?.voucherType?.id)) && (
                    <div className="mb-4">
                        <div className="row">
                            <div className="col-12">
                                <h5 className="fw-bold mb-3">
                                    Detalles
                                    <button
                                        type="button"
                                        className="ml-5 btn btn-icon btn-text-primary waves-effect waves-light"
                                        onClick={() => setVoucher({ ...voucher, lines: [
                                            ...voucher?.lines,
                                            { id: uniqueId(), type: 'DEBIT', accountingAccountCode: null, amount: 0 }
                                        ] })}
                                    >
                                        <i className="ri-add-line"></i>
                                    </button>
                                </h5>
                            </div>
                        </div>  
                        {
                            voucher?.lines.map((line: LinesAccoountingInterface) => (
                                <Fragment key={`line-${line.id}`}>
                                    <div className="row mt-2">
                                        <div className="col-md-2 col-sm-6">
                                            <InputSelectModal
                                                id={`typeLine-${line.id}`}
                                                label="Tipo de linea"
                                                value={line.type}
                                                onChange={(value: any) => {
                                                    setVoucher({
                                                        ...voucher,
                                                        lines: voucher?.lines.map(
                                                            (lineA: LinesAccoountingInterface) => 
                                                                lineA.id == line.id ? { ...lineA, type: value } : lineA)    
                                                    })}
                                                }
                                                options={typesLines}
                                                placeholder="Seleccione un tipo de linea"
                                                required
                                                multiple={false}
                                                newOption={false}
                                                error={null}
                                            />
                                        </div>
                                        <div className="col-md-6 col-sm-6">
                                            <InputSelectModal
                                                id={`accountingAccount-${line.id}`}
                                                label="Cuenta contable"
                                                value={line.accountingAccountCode ?? null}
                                                onChange={(value: string) => {
                                                    setVoucher({
                                                        ...voucher,
                                                        lines: voucher?.lines.map((lineA: LinesAccoountingInterface) => lineA.id == line.id ? { ...lineA, accountingAccountCode: value  } : lineA)
                                                    })
                                                }}
                                                options={accountingAccountsFiltered}
                                                placeholder="Seleccione una cuenta contable"
                                                required
                                                multiple={false}
                                                newOption={false}
                                                error={null}
                                            />
                                        </div>
                                        <div className="col-md-3 col-sm-6">
                                            <InputModal
                                                type="number"
                                                id={`amount-${line.id}`}
                                                label="Monto"
                                                value={line.amount ?? 0}
                                                onChange={(e: any) => setVoucher({ ...voucher, lines: voucher?.lines.map((lineA: LinesAccoountingInterface) => lineA.id == line.id ? { ...lineA, amount: e.target.value } : lineA) })}
                                                error={null}
                                                required
                                                placeholder="Ingrese el monto"
                                                maxLength={undefined}
                                                inputMode={undefined}
                                                pattern={undefined}
                                                min={undefined}
                                                max={undefined}
                                            />
                                        </div>
                                        <div className="col-md-1 col-sm-6">
                                            <button
                                                type="button"
                                                className="btn btn-icon btn-text-danger waves-effect waves-light"
                                                onClick={() => setVoucher({ ...voucher, lines: voucher?.lines.filter((lineA: LinesAccoountingInterface) => lineA.id != line.id) })}
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        </div>
                                    </div>
                                </Fragment>
                            ))
                        }
                    </div>
                )
            }

            <div className="row mb-4">
                <div className="col-12">
                    <InputDropFile
                        id="file"
                        label="Soporte documental"
                        placeholder="Adjuntar archivo (PDF, imagen, etc.)"
                        value={voucher?.file}
                        uploadUrl={null}
                        onChange={(value) => setVoucher({ ...voucher, file: value })}
                    />
                </div>
            </div>
        </>
    )
}

export default FormVoucher;