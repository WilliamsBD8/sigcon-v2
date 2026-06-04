import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { InvoiceInterface, VoucherInterface } from "../interfaces/invoice.interface";
import { fetchHelper } from "@/utils/fetch";
import { base_url, formatDate, formatPrice } from "@/utils/functions";
import HeaderForm from "../details/headers";
import PageLoad from "@/pages/errors/page_load";
import { useSelector } from "react-redux";
import DataTableReference from "@/components/organism/DataTable";
import { FileInterface, PaymentFormInterface, PaymentInterface, PaymentMethodInterface } from "../interfaces/payments.interface";
import InputSelectModal from "@/components/molecules/inputSelectModal";
import InputDate from "@/components/molecules/InputDate";
import TextareaModal from "@/components/molecules/TextareaModal";
import InputModal from "@/components/molecules/InputModal";
import AlertPage from "@/components/molecules/AlertPage";
import InputDropFile from "@/components/molecules/InputDropFile";

const IndexInvoicePayments = () => {

    const user = useSelector((state: any) => state.user).user;
    const company = user.company;
    const userPermissions = user.permissions?.filter((p:any) => p.code.includes('VOUCHER')) || [];
    const isAdmin = user.isAdmin || false;

    const { id } = useParams();
    const [invoice, setInvoice] = useState<InvoiceInterface | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState<any | null>({
        message: '',
        type: '',
        show: false,
        time: 0,
        html: false
    });

    const [reload, setReload] = useState(0);

    const [errorVoucher, setErrorVoucher] = useState<any | null>({
        message: '',
        type: '',
        show: false,
        time: 0,
        html: false
    });
    const [errorsVoucher, setErrorsVoucher] = useState<any | null>({});

    const table = useRef<any>(null);
    const dataTable = useRef<any>(null);

    const modalRef      = useRef<any>(null);
    const modalInstance = useRef<any>(null);

    const [voucher, setVoucher] = useState<PaymentInterface | null>(null);

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInterface[] | []>([]);
    const [paymentForms, setPaymentForms] = useState<PaymentFormInterface[] | []>([]);
    const [cashPayments, setCashPayments] = useState<any[] | []>([]);
    const [checks, setChecks] = useState<any[] | []>([]);
    const [checkBooks, setCheckBooks] = useState<any[] | []>([]);
    const [bankAccounts, setBankAccounts] = useState<any[] | []>([]);
    const [voucherTypes, setVoucherTypes] = useState<any[]>([]);

    const columns = useMemo(() => {
        return [
        { data: 'number', title: 'Número' },
        { data: 'paymentDate', title: 'Fecha' },
        { data: 'valuePayment', title: 'Monto', render: (data: any) => formatPrice(data, company?.currency?.isoCode) },
        { data: 'description', title: 'Descripción', render: (data: any) => data || '-' },
        { data: 'id', title: 'Acción', render: (id: any) => (
            `
                <div class="d-flex gap-1">
                    ${actions.map(a => `
                        <a class="btn btn-sm btn-text-${a.class}  rounded-pill btn-icon action-btn tool"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            data-bs-custom-class="tooltip-${a.class}"
                            data-bs-original-title="${a.title}"
                            data-action="${a.key}"
                            data-id="${id}">
                            <i class="${a.icon}"></i>
                        </a>
                    `).join('')}
                </div>
            `
        ) }
    ]}, [invoice]);
    
    const [buttons, setButtons] = useState([]);

    useEffect(() => {
        setButtons([
            ...(
                invoice?.header?.status != 'PAID' ?
                (userPermissions.includes('CREATE_VOUCHER') || isAdmin ? [
                    {
                        text: '<i class="ri-add-line ri-16px me-sm-2"></i> <span class="d-none d-sm-inline-block">Registrar Pago</span>',
                        className: 'btn rounded-pill btn-primary waves-effect mx-2 my-2 ',
                        action: function () {
                            setVoucher({
                                id: null,
                                number: null,
                                voucherType: null,
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
                                thirdPartyId: null
                            });
                            openModal();
                        }
                    }
                ] : [])
                : []
            )
        ])
        setReload(reload + 1);
    }, [invoice]);

    const actions = useMemo(() => {
        return [
            ...(userPermissions.includes('UPDATE_VOUCHER') || isAdmin ? [
                {
                    key: 'edit',
                    icon: 'ri-pencil-line',
                    class: 'info',
                    title: 'Editar Pago'
                },
            ] : []),
            ...(userPermissions.includes('DELETE_VOUCHER') || isAdmin ? [
                {
                    key: 'delete',
                    icon: 'ri-delete-bin-line',
                    class: 'danger',
                    title: 'Eliminar Pago'
                }
            ] : [])
        ]
    }, [invoice, userPermissions, isAdmin]);

    const loadInvoice = async () => {
        const {data} = await fetchHelper.get(base_url(['api/v1/invoices', id]), {}, 0);
        setInvoice({
            id: data.header.id,
            header: {
                type: {
                    code: data.header.type.code,
                    codeNumber: data.header.type.codeNumber,
                    name: data.header.type.name
                },
                documentId: data.header.documentId,
                issueDate: data.header.issueDate,
                dueDate: data.header.dueDate,
                status: data.header.status,
                serial: data.header.serial
            },
            values: {
                totalPayment: data.values.totalPayment,
                totalAmount: data.values.totalAmount,
                totalDiscount: data.values.totalDiscount,
                totalTax: data.values.totalTax
            },
            state: data.state ? {
                id: data.state.id,
                code: data.state.code,
                name: data.state.name,
                description: data.state.description,
                color: data.state.color
            } : null,
            thirdParty: {
                id: data.thirdParty.id,
                code: data.thirdParty.thirdPartyCode,
                nit: data.thirdParty.nit,
                dv: data.thirdParty.dv,
                name: data.thirdParty.businessName,
                address: data.thirdParty.address,
                city: data.thirdParty.city,
                country: data.thirdParty.country,
                email: data.thirdParty.email,
                isoCode: data.thirdParty.currencyType?.isoCode || ''
            },
            lineInvoices: [],
            notes: data.notes || '',
            exchangeRate: data.exchangeRate ? {
                id: data.exchangeRate.id,
                value: data.exchangeRate.value,
                currencyChanged: data.exchangeRate.currencyExchange.isoCode,
                currencyChangedTo: data.exchangeRate.currencyExchanged.isoCode
            } : null,
            productId: null,
            product: null,
            transaction: {
                id: null,
                thirdPartyId: null,
                number: null,
                voucherType: null,
                bankAccount: null,
                cashAccount: null,
                check: null,
                paymentFormId: data.transaction.paymentFormId,
                methodPaymentId: data.transaction.methodPaymentId,
                valuePayment: data.transaction.valuePayment,
                paymentDate: data.transaction.paymentDate,
                description: data.transaction.description,
                file: null,
                reference: null,
                lines: []
            },
            vouchers: data.vouchers?.map((voucher: any) => {
                return {
                    id: voucher.id,
                    number: voucher.number,
                    valuePayment: voucher.amount,
                    paymentFormId: null,
                    methodPaymentId: voucher.paymentMethod.id,
                    bankAccount: voucher.bankAccount,
                    cashAccount: voucher.cashAccount,
                    check: voucher.check,
                    paymentDate: voucher.date,
                    description: voucher.description,
                    file: voucher.file ? {
                        name: voucher.file,
                        base64: null
                    } : null,
                    reference: voucher.reference
                }
            })
        });
    }

    const loadData = async () => {
        const {data: dataPaymentForms} = await fetchHelper.post(base_url(['api/v1/resources/payment-forms']), {length: -1}, {}, 0, false);
        setPaymentForms(dataPaymentForms.map((d: any) => ({
            id: d.id, code: d.code, name: d.name
        })));

        const {data: dataPaymentMethods} = await fetchHelper.post(base_url(['api/v1/resources/payment-methods']), {length: -1}, {}, 0, false);
        setPaymentMethods(dataPaymentMethods.map((d: any) => ({
            id: d.id, code: d.code, name: d.name
        })));

        const {data: dataCashPayments} = await fetchHelper.post(base_url(['api/v1/cash/search']), {length: -1}, {}, 0, false);
        setCashPayments(dataCashPayments.map((d: any) => ({
            id: d.id, code: d.code, name: d.name
        })));

        const {data: dataCheckBooks} = await fetchHelper.post(base_url(['api/v1/banks/checkbooks/search']), {length: -1}, {}, 0, false);
        setCheckBooks(dataCheckBooks.map((d: any) => ({
            id: d.id, code: d.code, name: d.name
        })));

        const {data: dataBankAccounts} = await fetchHelper.post(base_url(['api/v1/bank-accounts/search']), {length: -1}, {}, 0, false);
        setBankAccounts(dataBankAccounts.map((d: any) => ({
            id: d.id, label: `${d.accountNumberMasked} - ${d.accountName}`, type: d.accountType
        })));

        const typesRes = await fetchHelper.post(base_url(['api', 'v1', 'vouchers', 'types']), {length: -1}, {}, 0, false);
        setVoucherTypes(typesRes?.data ?? []);
    }

    const openModal = () => {
        if (!modalInstance.current)
            modalInstance.current = new (window as any).bootstrap.Modal(modalRef.current);
        modalInstance.current.show();
    }

    const closeModal = () => {
        if (modalInstance.current)
            modalInstance.current.hide();
    }

    useEffect(() => {
        loadInvoice();
        loadData();
    }, [id]);

    useEffect(() => {
        
        const table = dataTable?.current;
        if (!table) return;
        const handler = async function () {
            const action = $(this).data("action");
            const id = Number($(this).data("id"));
            const voucherData = invoice?.vouchers?.find((v:PaymentInterface) => v?.id === id);
            if (!voucherData) {
                console.warn("Comprobante no encontrado", id);
                return;
            }
            switch(action) {
                case "edit":
                    setVoucher({
                        id: voucherData.id,
                        valuePayment: voucherData.valuePayment,
                        paymentFormId: voucherData.paymentFormId,
                        methodPaymentId: voucherData.methodPaymentId,
                        bankAccount: voucherData.bankAccount,
                        cashAccount: voucherData.cashAccount,
                        check: voucherData.check,
                        paymentDate: voucherData.paymentDate,
                        description: voucherData.description,
                        file: voucherData.file,
                        reference: voucherData.reference,
                        lines: voucherData.lines,
                        number: voucherData.number,
                        voucherType: voucherData.voucherType,
                        thirdPartyId: null
                    });
                    openModal();
                    break;
                case "delete":
                    (window as any).Swal.fire({
                        title: '¿Eliminar comprobante?',
                        text: '¿Estás seguro de querer eliminar el comprobante?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                        if (!result.isConfirmed) return;
                        try {
                            const url = base_url(['api/v1/vouchers/delete', id]);
                            await fetchHelper.delete(url, {}, {}, 1, false);
                            await loadInvoice();
                            loadDataTable();
                            closeModal();
                            setMessage({ message: 'Comprobante eliminado correctamente', type: 'success', show: true, time: 0, html: false });
                        } catch (error) {
                            console.warn("Error al eliminar el comprobante", error);
                            setMessage({ message: error?.msg || 'Error al eliminar el comprobante', type: 'danger', show: true, time: 0, html: false });
                        }
                    });
                    break;
                default:
                    console.warn("Acción no válida", action);
                    break;
            }
        };
        table.on('click', '.action-btn', handler);
        return () => table.off('click', '.action-btn', handler);
    }, [invoice]);

    useEffect(() => {
        if(invoice?.vouchers) {
            loadDataTable();
        }
    }, [invoice?.vouchers]);


    if(!invoice) return <PageLoad />

    const loadDataTable = () => {
        const dataTableRef = dataTable?.current;
        if(dataTableRef) {
            dataTableRef.clear();
            dataTableRef.rows.add(invoice?.vouchers || []);
            dataTableRef.draw();
        }
    }

    const handleSaveVoucher = async () => {
        const typeCode = invoice?.header?.type?.code === 'FC' ? 'PAYMENT' : 'RECEIPT';
        const voucherTypeId = voucherTypes.find((t: any) => t.code === typeCode)?.id ?? null;

        console.log(voucherTypeId, 'voucherTypeId');

        const payload = {
            invoiceId: invoice?.id,
            voucherTypeId,
            ...voucher
        }
        setErrorsVoucher({});
        setErrorVoucher({ message: '', type: '', show: false, time: 0, html: false });
        try {
            setIsSending(true);
            let url = base_url(['api/v1/vouchers/create']);
            let data = null;
            if(payload.id){
                url = base_url(['api/v1/vouchers/update', payload.id]);
                data = await fetchHelper.put(url, payload, {}, 0, false);
            }else{
                data = await fetchHelper.post(url, payload, {}, 0, false);
            }
            await loadInvoice();
            loadDataTable();
            closeModal();
            setMessage({ message: data.message, type: 'success', show: true, time: 0, html: false });
        } catch (error) {
            const errores = error?.errors;
            if (errores && errores.length > 0) {
                const fieldErrors = { };
                errores.forEach(e => { fieldErrors[e.field] = e.message; });
                setErrorsVoucher(fieldErrors);
            } else {
                setErrorVoucher({ message: error?.msg || 'Error al guardar el comprobante', type: 'danger', show: true, time: 0, html: false });
            }
        } finally {
            setIsSending(false);
        }

    }
    
    return (
        <>
        
            <div className="card">
                <HeaderForm
                    type={invoice?.header?.type}
                    serial={String(invoice?.header?.serial)}
                    title={`Pagos`}
                />
            </div>

            <div className="card">
                <div className="card-body invoice-preview-header rounded-4 p-6">
                    <div className="d-flex justify-content-between flex-xl-row flex-md-column flex-sm-row flex-column text-heading align-items-xl-start align-items-md-start align-items-sm-center flex-wrap gap-6">
                        <div>
                            <p className="mb-1">
                                <span><b>{invoice?.header?.type?.code == 'FC' ? 'Proveedor:' : 'Cliente:'}</b></span>
                                <span> {invoice?.thirdParty?.name}</span>
                            </p>
                            <p className="mb-1">
                                <span><b>{'NIT:'}</b></span>
                                <span> {invoice?.thirdParty?.nit}-{invoice?.thirdParty?.dv || 'X'}</span>
                            </p>
                            <p className="mb-1">
                                <span><b>{'Total a pagar:'}</b></span>
                                <span> {formatPrice(invoice?.values?.totalPayment, company?.currency?.isoCode)}</span>
                            </p>
                            <p className="mb-1">
                                <span><b>{'Total pagado:'}</b></span>
                                <span> {formatPrice(invoice?.vouchers?.reduce((acc: number, voucher: PaymentInterface) => acc + (voucher.valuePayment ?? 0), 0), company?.currency?.isoCode)}</span>
                            </p>
                            <p className="mb-1">
                                <span><b>{'Notas:'}</b></span>
                                <span> {invoice?.notes}</span>
                            </p>
                        </div>
                        <div>
                            <div className="mb-1">
                                <span><b>{'Fecha de emisión:'}</b></span>
                                <span> {formatDate(invoice?.header?.dueDate, "YYYY-MM-DD")}</span>
                            </div>
                            {
                                invoice?.header?.issueDate && (
                                    <div className="mb-1">
                                        <span><b>{'Fecha de vencimiento:'}</b></span>
                                        <span> {formatDate(invoice?.header?.issueDate, "YYYY-MM-DD")}</span>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>

            </div>

            <div className="card">
                <div className="card-body">
                    {
                        message.show && (
                            <AlertPage
                                message={message.message}
                                type={message.type}
                                show={message.show}
                                duration={message.time}
                                html={false}
                                onChange={() => setMessage({ message: '', type: '', show: false, time: 0, html: false })}
                            />
                        )
                    }
                    <div className="card-datatable invoice-table">
                        <DataTableReference
                            tableRef={table}
                            dataTableRef={dataTable}
                            columns={columns}
                            data={invoice?.vouchers}
                            buttons={buttons}
                            title="Pagos"
                            reload={reload}
                        />
                    </div>
                </div>
            </div>

            {/* Modal para la creacion - edicion voucher */}

            <div className="modal fade" ref={modalRef} tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="ri-receipt-line me-2"></i>{voucher?.id ? 'Editar Comprobante' : 'Registrar Comprobante'}
                            </h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">

                            <div className="alert alert-info py-2">
                                El asiento contable se generará automáticamente con las cuentas de
                                {invoice?.header?.type?.code === 'FC' ? ' proveedores y bancos/caja' : ' cartera y bancos/caja'}.
                            </div>

                            {
                                errorVoucher.show && (
                                    <AlertPage
                                        message={errorVoucher.message}
                                        type={errorVoucher.type}
                                        show={errorVoucher.show}
                                        duration={0}
                                        html={false}
                                        onChange={() => setErrorVoucher({ message: '', type: '', show: false, time: 0, html: false })}
                                    />
                                )
                            }

                            <div className="row">
                                <div className="col-12 mb-2">
                                    <InputModal
                                        type="number"
                                        id="valuePayment"
                                        label="Monto"
                                        placeholder="Ingrese el monto"
                                        value={voucher?.valuePayment ?? 0}
                                        onChange={(e: any) => {
                                            const value = Number(e.target.value);
                                            setVoucher({ ...voucher, valuePayment: value })
                                        }}
                                        maxLength={10}
                                        inputMode="decimal"
                                        pattern="^[0-9.]+$"
                                        min={0}
                                        max={undefined}
                                        required={true}
                                        error={false}
                                        disabled={false}
                                    />
                                </div>
                                <div className="col-12 mb-2">
                                    <InputSelectModal
                                        id="paymentMethodId"
                                        label="Método de pago"
                                        placeholder="Selecciona un método de pago"
                                        labelOption="paymentMethodId"
                                        options={paymentMethods}
                                        value={voucher?.methodPaymentId}
                                        onChange={(value: string) => {
                                            setVoucher({ ...voucher, methodPaymentId: value })
                                        }}
                                        required={true}
                                        error={false}
                                        disabled={paymentMethods.length === 0}
                                    />
                                </div>
                                {
                                    voucher?.methodPaymentId && (
                                        <>
                                            {
                                                voucher?.methodPaymentId == 1 && ( // Cuenta de caja
                                                    <>
                                                        <div className="col-12 mb-2">
                                                            <InputSelectModal
                                                                id="cashPaymentId"
                                                                label="Cuenta de caja"
                                                                placeholder="Selecciona una cuenta de caja"
                                                                labelOption="cashPaymentId"
                                                                options={cashPayments}
                                                                value={voucher?.cashAccount?.id}
                                                                onChange={(value: string) => {
                                                                    setVoucher({ ...voucher, cashAccount: { id: value, accountNumber: null } })
                                                                }}
                                                                required={true}
                                                                error={false}
                                                                disabled={cashPayments.length === 0}
                                                            />
                                                        </div>
                                                    </>
                                                ) || voucher?.methodPaymentId == 2 && ( // Chequera
                                                    <>
                                                        <div className="col-12 mb-2">
                                                            <InputSelectModal
                                                                id="checkbookId"
                                                                label="Chequera"
                                                                placeholder="Selecciona una chequera"
                                                                labelOption="checkbookId"
                                                                options={checkBooks}
                                                                value={voucher?.check?.checkbookId}
                                                                onChange={(value: string) => {
                                                                    setVoucher({ ...voucher, check: { checkbookId: value, numberCheck: null, id: null, checkbookNumber: null } })
                                                                }}
                                                                required={true}
                                                                error={false}
                                                                disabled={checkBooks.length === 0}
                                                            />
                                                        </div>
                                                    </>
                                                ) || voucher?.methodPaymentId == 3 && ( // Cheque
                                                    <>
                                                        <div className="col-12 mb-2">
                                                            <InputSelectModal
                                                                id="checkId"
                                                                label="Cheque"
                                                                placeholder="Selecciona un cheque"
                                                                labelOption="checkId"
                                                                options={checks}
                                                                value={voucher?.check?.id}
                                                                onChange={(value: string) => {
                                                                    setVoucher({ ...voucher, check: { id: value, numberCheck: null, checkbookId: null, checkbookNumber: null } })
                                                                }}
                                                                required={true}
                                                                error={false}
                                                                disabled={checks.length === 0}
                                                            />
                                                        </div>
                                                    </>
                                                ) || (
                                                    <>
                                                        <div className="col-12 mb-2">
                                                            <InputSelectModal
                                                                id="bankAccountId"
                                                                label="Cuenta bancaria"
                                                                placeholder="Selecciona una cuenta bancaria"
                                                                labelOption="bankAccountId"
                                                                options={bankAccounts.filter((d: any) => d.type == (
                                                                    voucher?.methodPaymentId == 4 ? "CORRIENTE" : 
                                                                    voucher?.methodPaymentId == 5 ? "AHORROS" : "TARJETA_CREDITO"
                                                                ))}
                                                                value={voucher?.bankAccount?.id}
                                                                onChange={(value: string) => {
                                                                    setVoucher({ ...voucher, bankAccount: { id: value, accountNumber: null } })
                                                                }}
                                                                required={true}
                                                                error={false}
                                                                disabled={bankAccounts.length === 0}
                                                            />
                                                        </div>
                                                    </>
                                                )
                                            }
                                        </>
                                    )
                                }
                                <div className="col-12 mb-2">
                                    <InputDate
                                        id="paymentDate"
                                        label="Fecha de pago"
                                        dateFormat="Y-m-d"
                                        placeholder="Selecciona una fecha"
                                        date={voucher?.paymentDate}
                                        onChange={(value: string) => {
                                            setVoucher({ ...voucher, paymentDate: value })
                                        }}
                                        required={true}
                                        error={false}
                                        disabled={false}
                                    />
                                </div>

                                <div className="col-12 mb-2">
                                    <TextareaModal
                                        id="description"
                                        label="Descripción"
                                        value={voucher?.description ?? ''}
                                        onChange={(value: any) => {
                                            const description = value.target.value;
                                            setVoucher({ ...voucher, description: description })
                                        }}
                                        error={false}
                                        placeholder="Descripción opcional"
                                    />
                                </div>

                                <div className="col-12 mb-2">
                                    <InputDropFile
                                        id="file"
                                        label="Comprobante"
                                        placeholder="Seleccione un archivo"
                                        value={
                                            voucher?.file
                                        }
                                        uploadUrl={null}
                                        onChange={(value:FileInterface) => {
                                            console.log(voucher, value, 'value');
                                            setVoucher({ ...voucher, file: value })
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveVoucher} disabled={isSending}>
                                {isSending ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default IndexInvoicePayments;