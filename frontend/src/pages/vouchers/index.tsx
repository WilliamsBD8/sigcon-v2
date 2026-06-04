import { useEffect, useMemo, useRef, useState } from "react";
import { BankAccountInterface, CashAccountInterface, CheckInterface, LinesAccoountingInterface, PaymentInterface, PaymentMethodInterface } from "../invoices/interfaces/payments.interface";
import { AccountingAccountInterface, VoucherTypeInterface } from "./interfaces/voucher.interfaces";
import { fetchHelper } from "@/utils/fetch";
import { base_url, formatDate, formatPrice } from "@/utils/functions";
import AlertPage from "@/components/molecules/AlertPage";
import DataTableReference from "@/components/organism/DataTable";
import FormVoucher from "./form";
import { uniqueId } from "lodash";
import { useSelector } from "react-redux";
import ViewVoucher from "./view";
import { ThirdPartyInterface as ThirdPartyInterfaceInvoice } from "../invoices/interfaces/invoice.interface";
import { ThirdPartyInterface } from "./interfaces/thirdsParty.interface";

const IndexVouchers = () => {

    const user = useSelector((state: any) => state.user.user);
    const userPermissions = user?.permissions?.filter((p: any) => {return p.code.includes('VOUCHER')}) || [];
    const isAdmin = user?.isAdmin || false;

    const tableRef = useRef(null);
    const dataTableRef = useRef(null);

    const modalRef = useRef(null);
    const modalInstance = useRef(null);

    const modalViewRef = useRef(null);
    const modalInstanceView = useRef(null);

    const [message, setMessage] = useState({
        show: false,
        message: '',
        type: 'danger',
        duration: 4000,
        html: false,
    });

    const [messageForm, setMessageForm] = useState({
        message: "",
        type: "danger",
        show: false,
        duration: 5000,
        html: false,
    });

    const [voucher, setVoucher] = useState<PaymentInterface | null>({
        id: null,
        valuePayment: 0,
        paymentFormId: null,
        methodPaymentId: null,
        bankAccount: null,
        cashAccount: null,
        check: null,
        paymentDate: null,
        description: null,
        file: null,
        reference: null,
        thirdPartyId: null,
        lines: [],
        number: null,
        voucherType: null,
    });

    const [vouchersTypes, setVouchersTypes] = useState<VoucherTypeInterface[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInterface[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [cashAccounts, setCashAccounts] = useState<any[]>([]);
    const [checks, setChecks] = useState<any[]>([]);
    const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccountInterface[]>([]);
    const [thirdParties, setThirdParties] = useState<ThirdPartyInterface[]>([]);
    const [thirdPartiesComplete, setThirdPartiesComplete] = useState<any[] | null>(null);
    const [thirdParty, setThirdParty] = useState<ThirdPartyInterfaceInvoice | null>(null);

    const [data, setData] = useState<any[]>([]);

    const loadData = async () => {

        const [
            typeVouchersResponse,
            paymentMethodsResponse,
            bankAccountsResponse,
            cashAccountsResponse,
            checksResponse,
            accountingAccountsResponse,
            thirdPartiesResponse
        ] = await Promise.allSettled([
            fetchHelper.post(base_url(['api/v1/vouchers/types']), {
                length: -1,
                columns: [
                    { data: "code", searchable: true, search: { value: "PAYROLL,SERVICE_PAYMENT,SERVICE_RECEIPT", regex: false } },
                ]
            }, {}, 0, false),
            fetchHelper.post(base_url(['api/v1/resources/payment-methods']), {
                length: -1
            }, {}, 0, false),
            fetchHelper.post(base_url(['api/v1/bank-accounts/search']), {
                length: -1,
                columns: [
                    {data: "status", searchable: true, search: {value: "ACTIVA", regex: false}},
                ]
            }, {}, 0, false),
            fetchHelper.post(base_url(['api/v1/cash/search']), {
                length: -1,
                columns: [
                    {data: "cashStatus", searchable: true, search: {value: "ACTIVA", regex: false}},
                ]
            }, {}, 0, false),
            fetchHelper.post(base_url(['api/v1/banks/checks/search']), {
                length: -1,
                columns: [
                    {data: "checkbook.status", searchable: true, search: {value: "ACTIVA", regex: false}},
                    {data: "statusCheck", searchable: true, search: {value: "EMITIDO", regex: false}}
                ]
            }, {}, 0, false),
            fetchHelper.post(base_url(["api", "v1", "accounting-accounts"]),
            {
                length: -1,
                columns: [
                    {data: "pucAccount.code", searchable: true, search: {value: "51%,41%", regex: true}}
                ]
            }, {}, 0, false),
            fetchHelper.post(base_url(['api/v1/third-parties/search']),
            {
                length: -1,
                columns: [
                    { data: "status.id", searchable: true, search: { value: 1, regex: false } },
                ]
            }, {}, 0, false),
        ]);

        if(typeVouchersResponse.status === 'fulfilled') {
            setVouchersTypes(typeVouchersResponse.value.data || []);
        }
        if(paymentMethodsResponse.status === 'fulfilled') {
            setPaymentMethods(paymentMethodsResponse.value.data || []);
        }
        if(bankAccountsResponse.status === 'fulfilled') {
            setBankAccounts(bankAccountsResponse.value.data || []);
        }
        if(cashAccountsResponse.status === 'fulfilled') {
            setCashAccounts(cashAccountsResponse.value.data || []);
        }
        if(checksResponse.status === 'fulfilled') {
            setChecks(checksResponse.value.data || []);
        }
        if(accountingAccountsResponse.status === 'fulfilled') {
            setAccountingAccounts(accountingAccountsResponse.value.data || []);
        }
        if(paymentMethodsResponse.status === 'fulfilled') {
            setPaymentMethods(paymentMethodsResponse.value.data || []);
        }
        if(thirdPartiesResponse.status === 'fulfilled') {
            setThirdParties(thirdPartiesResponse.value.data.map((t: any) => ({
                id: t.id,
                name: t.businessName,
                code: t.thirdPartyCode,
                roles: t.roles.map((r: any) => ({
                    name: r.name,
                })),
            })) || []);
            setThirdPartiesComplete(thirdPartiesResponse.value.data || []);
        }
    };

    const [reload, setReload] = useState(0);

    const buttons = useMemo(() => [
        ...(
            userPermissions.some((p: any) => p.code === 'CREATE_VOUCHER' && p.type === 'CREATE') || isAdmin ? 
            [
                {
                    text: '<i class="ri-add-line ri-16px me-sm-2"></i> <span class="d-none d-sm-inline-block">Registrar Comprobante</span>',
                    className: 'btn rounded-pill btn-primary waves-effect mx-2 my-2 ',
                    action: () => {
                        setVoucher({
                            id: null,
                            valuePayment: 0,
                            paymentFormId: null,
                            methodPaymentId: null,
                            bankAccount: null,
                            cashAccount: null,
                            check: null,
                            paymentDate: null,
                            description: null,
                            file: null,
                            reference: null,
                            thirdPartyId: null,
                            lines: [],
                            number: null,
                            voucherType: null,
                        });
                        openFormVoucher();
                    }
                }

            ] : []
        )
    ], []);

    const actions = useMemo(() => {
        return [
            { key: 'view', icon: 'ri-eye-line', class: 'info', title: 'Ver' },
            ...(
                userPermissions.some((p: any) => p.code === 'UPDATE_VOUCHER' && p.type === 'UPDATE') || isAdmin ? 
                [{ key: 'edit', icon: 'ri-edit-line', class: 'primary', title: 'Editar' }] : []
            ),
            ...(
                userPermissions.some((p: any) => p.code === 'DELETE_VOUCHER' && p.type === 'DELETE') || isAdmin ? 
                [{ key: 'delete', icon: 'ri-delete-bin-5-line', class: 'danger', title: 'Eliminar' }] : []
            ),
            
        ]
    }, [])

    const columns = useMemo(() => [
        { title: 'Tipo de comprobante', data: 'voucherType.name' },
        { title: 'Número de comprobante', data: 'number' },
        { title: 'Fecha de pago', data: 'date', render: (v: string) => formatDate(v, 'YYYY-MM-DD') },
        { title: 'Método de pago    ', data: 'paymentMethod.name' },
        { title: 'Origen de pago', data: 'id', render: (id: number, _, v: any) => {
            if(v.cashAccount) {
                return v.cashAccount.cashName;
            }
            if(v.check) {
                return `${v.check.checkbook.checkbookNumber} - ${v.check.numberCheck}`;
            }
            if(v.bankAccount) {
                return v.bankAccount.accountName;
            }
            return '-';
        } },
        { title: 'Valor', data: 'amount', render: (v: number) => formatPrice(v) },
        { title: 'Tercero', data: 'thirdParty.businessName'},
        {
            title: 'Acciones',
            data: 'id',
            searchable: false,
            render: (id: number, _, v: any) => {
                return `
                    <div class="d-flex gap-1">
                        ${actions.map((a: any) => `
                            <a  class="btn btn-sm btn-text-${a.class} rounded-pill btn-icon action-btn tool"
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
                `;
            }
        }
    ], []);

    const openFormVoucher = () => {
        if (!modalInstance.current) {
            modalInstance.current = new (window as any).bootstrap.Modal(modalRef.current);
        }
        modalInstance.current.show();
    }

    const closeFormVoucher = () => {
        if (modalInstance.current) {
            modalInstance.current.hide();
        }
    }

    const handleSaveVoucher = async () => {
        
        try {
            let error: string = "";
            if(!voucher?.paymentDate) {
                error = "La fecha de pago es requerida";
            }
            if(!voucher?.valuePayment) {
                error = "El monto es requerido";
            }
            if(!voucher?.methodPaymentId) {
                error = "El método de pago es requerido";
            }
            if(!voucher?.bankAccount && !voucher?.cashAccount && !voucher?.check) {
                error = "El origen de pago es requerido";
            }
            if(!voucher?.thirdPartyId) {
                error = "El tercero es requerido";
            }
            if([4, 5].includes(Number(voucher?.voucherType?.id)) && voucher?.lines?.length === 0) {
                error = "Necesita agregar al menos una linea contable";
            }
            if(error) {
                setMessageForm({
                    message: error,
                    type: "danger",
                    show: true,
                    duration: 5000,
                    html: false,
                });
                return;
            }
            if(voucher?.id) {
                let url = base_url(['api', 'v1', 'vouchers' , 'update', voucher.id]);
                const payload = {
                    ...voucher,
                    voucherTypeId: voucher.voucherType?.id,
                }
                const response = await fetchHelper.put(url, payload, {}, 1);
                setMessage({
                    message: response.data.message || response.data.msg || "Comprobante actualizado exitosamente",
                    type: "success",
                    show: true,
                    duration: 5000,
                    html: false,
                });
                closeFormVoucher();
            } else {
                // createVoucher();
                let url = base_url(['api', 'v1', 'vouchers' , 'create']);
                const payload = {
                    ...voucher,
                    voucherTypeId: voucher.voucherType?.id,
                }
                const response = await fetchHelper.post(url, payload, {}, 1);
                setMessage({
                    message: response.data.message || response.data.msg || "Comprobante creado exitosamente",
                    type: "success",
                    show: true,
                    duration: 5000,
                    html: false,
                });
                closeFormVoucher();
            }
            refreshTable();
        } catch (e) {

            console.log(e);

            setMessageForm({
                message: e.message || e.msg || "Error al crear el comprobante",
                type: "danger",
                show: true,
                duration: 0,
                html: false,
            });
        }
    }

    const refreshTable = () => {
        if(dataTableRef.current) {
            dataTableRef.current.ajax.reload();
        }
    }

    useEffect(() => {
        if(voucher?.id) {
            return;
        }
        setVoucher({ ...voucher, lines: [] });
        if([4, 5].includes(Number(voucher?.voucherType?.id))) {
            setVoucher({ ...voucher, lines: [{
                id: uniqueId(),
                accountingAccountCode: '',
                type: 'DEBIT',
                amount: 0,
            }] });
        }
    }, [voucher?.voucherType?.id]);

    const getLines = (lines: any[], voucherType: string) => {
        console.log("lines: ", lines);
        console.log("voucherType: ", voucherType);
        switch (voucherType) {
            case 'SERVICE_PAYMENT':
                return lines.filter((line: any) => line.accountingAccount.pucAccount.code.startsWith('51')).map(l => ({
                    id: l.id,
                    accountingAccountCode: l.accountingAccount.pucAccount.code,
                    type: l.type,
                    amount: l.amount,
                }));
            case 'SERVICE_RECEIPT':
                return lines.filter((line: any) => line.accountingAccount.pucAccount.code.startsWith('41')).map(l => ({
                    id: l.id,
                    accountingAccountCode: l.accountingAccount.pucAccount.code,
                    type: l.type,
                    amount: l.amount,
                }));
            default:
                return [];
        }
    }

    useEffect(() => {
        const table = dataTableRef?.current;
        if (!table) return;
        const handler = function () {
            const action = $(this).data("action");
            const id = Number($(this).data("id"));
            const row = data.find((item: any) => item.id === id);
            if (!row) {
                return console.warn('Comprobante no encontrado en data', id);
            }
            setVoucher({
                id: row.id,
                valuePayment: row.amount,
                paymentFormId: null,
                methodPaymentId: row.paymentMethod.id,
                bankAccount: row.bankAccount,
                cashAccount: row.cashAccount,
                check: row.check,
                paymentDate: row.date,
                description: row.description,
                file: row.file,
                reference: row.reference,
                thirdPartyId: row.thirdParty.id,
                lines: getLines(row?.accountingEntry?.lines, row.voucherType.code),
                number: row.number,
                voucherType: row.voucherType,
            });
            switch (action) {
                case "view":
                    openViewVoucher();
                    break;
                case "edit":
                    openFormVoucher();
                    break;
                case "delete":
                    (window as any).Swal.fire({
                        title: '¿Estás seguro?',
                        text: '¿Estás seguro de querer eliminar este comprobante?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Eliminar',
                        cancelButtonText: 'Cancelar',
                        customClass: {
                            confirmButton: 'btn btn-danger',
                            cancelButton: 'btn btn-secondary',
                        },
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            try {
                                const url = base_url(['api', 'v1', 'vouchers', 'delete', id]);
                                const response = await fetchHelper.delete(url, {}, {}, 1);
                                setMessage({
                                    message: response.message || response.msg || "Comprobante eliminado exitosamente",
                                    type: "success",
                                    show: true,
                                    duration: 5000,
                                    html: false,
                                });
                                refreshTable();
                            } catch (error) {
                                setMessage({
                                    message: error.message || error.msg || "Error al eliminar el comprobante",
                                    type: "danger",
                                    show: true,
                                    duration: 5000,
                                    html: false,
                                });
                                console.error(error);
                            }
                        }
                    });
                    break;
            }
        };
        table.on('click', '.action-btn', handler);
        return () => table.off('click', '.action-btn', handler);
    }, [data]);

    useEffect(() => {
        if(voucher?.thirdPartyId) {
            const third = thirdPartiesComplete.find((t: any) => t.id == voucher?.thirdPartyId);
            if(third) {
                setThirdParty({
                    id: third.id,
                    code: third.thirdPartyCode,
                    dv: third.dv,
                    nit: third.nit,
                    name: third.businessName,
                    address: third.address,
                    city: third.municipality.name,
                    country: third.municipality.country.name,
                    email: third.contacts.length > 0 ? third.contacts[0].email : null,
                    isoCode: third.municipality.country.isoCode,
                });
            }
        }
    }, [voucher?.thirdPartyId]);

    useEffect(() => {
        loadData();
    }, []);

    const closeViewVoucher = () => {
        if (modalInstanceView.current) {
            modalInstanceView.current.hide();
        }
    }

    const openViewVoucher = () => {
        if (!modalInstanceView.current) {
            modalInstanceView.current = new (window as any).bootstrap.Modal(modalViewRef.current);
        }
        modalInstanceView.current.show();
    }

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">Comprobantes contables</h5>
                    <p className="text-muted mb-0 small">
                        Comprobantes sin factura (nómina, servicios, etc.). Defina el asiento con líneas de débito y crédito;
                        las cuentas permitidas dependen del tipo seleccionado.
                    </p>
                </div>
                <div className="card-body">
                    {message.show && (
                        <>
                            <AlertPage
                                key={"alert-form-voucher"}
                                message={message.message}
                                type={message.type}
                                show={message.show}
                                duration={message.duration}
                                html={false}
                                onChange={() => setMessage({ ...message, show: false })}
                            />
                        </>
                    )}
                    <div className="card-datatable">
                        <DataTableReference
                            tableRef={tableRef}
                            dataTableRef={dataTableRef}
                            columns={columns}
                            url_api={['api', 'v1', 'vouchers', 'search']}
                            postPayload={{ standaloneOnly: true }}
                            buttons={buttons}
                            title="Comprobantes"
                            filterColumns={
                                [
                                    { data: "voucherType.code", searchable: true, search: { value: "PAYROLL,SERVICE_PAYMENT,SERVICE_RECEIPT", regex: false } },
                                ]
                            }
                            setData={setData}
                            reload={reload}
                        />
                    </div>
                </div>
            </div>

            <div className="modal fade" id="formVoucher" ref={modalRef} tabIndex={-1} aria-labelledby="formVoucherLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="formVoucherLabel">
                                <i className="ri-receipt-line me-2" />
                                {
                                    voucher.id ? `Editar Comprobante #${voucher?.number}`  : 'Registrar Comprobante'
                                }
                            </h5>
                        </div>
                        <div className="modal-body">

                            {messageForm.show && (
                                <AlertPage
                                    key={"alert-form-voucher"}
                                    message={messageForm.message}
                                    type={messageForm.type}
                                    show={messageForm.show}
                                    duration={messageForm.duration}
                                    html={false}
                                    onChange={() => setMessageForm({ ...messageForm, show: false })}
                                />
                            )}

                            <FormVoucher
                                closeFormVoucher={closeFormVoucher}
                                typesVouchers={vouchersTypes}
                                paymentMethods={paymentMethods}
                                bankAccounts={bankAccounts}
                                cashAccounts={cashAccounts}
                                checks={checks}
                                thirdParties={thirdParties}
                                accountingAccounts={accountingAccounts}
                                voucher={voucher}
                                setVoucher={setVoucher}
                                setMessage={setMessage}
                            />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeFormVoucher}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveVoucher}>Guardar</button>
                        </div>
                    </div>
                </div>
            </div>

            <ViewVoucher
                user={user}
                voucher={voucher}
                closeViewVoucher={closeViewVoucher}
                modalRef={modalViewRef}
                thirdParty={thirdParty}
                accountingAccounts={accountingAccounts}
            />
        </>
    );
};

export default IndexVouchers;