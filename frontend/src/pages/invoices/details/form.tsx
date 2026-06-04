import { useEffect, useReducer, useState } from "react";
import { ExchangeRateInterface, InvoiceInterface, ProductInterface, ThirdPartyInterface, TypeInterface } from "../interfaces/invoice.interface";
import InputSelectModal from "@/components/molecules/inputSelectModal";
import { fetchHelper } from "@/utils/fetch";
import { base_url } from "@/utils/functions";
import { Product } from "../interfaces/products.interface";
import InputDate from "@/components/molecules/InputDate";
import { useSelector } from "react-redux";
import TextareaModal from "@/components/molecules/TextareaModal";
import AlertPage from "@/components/molecules/AlertPage";
import { PaymentFormInterface, PaymentMethodInterface } from "../interfaces/payments.interface";

interface Requireds {
    id: string;
    required: boolean;
    message: string;
}

interface Props {
    invoice: InvoiceInterface;
    setInvoice: Function;
    requireds: Requireds[];
    fieldsEditable: {
        [key: string]: boolean;
    } | null;
    fieldsForm: {
        [key: string]: boolean;
    } | null;
    /** Rol de tercero en catálogo: 1=CLIENTE, 2=PROVEEDOR */
    thirdPartyRoleId?: string;
    thirdPartyLabel?: string;
    /** Cargar catálogo de productos de la empresa (ventas) en lugar de filtrar por proveedor */
    loadAllProducts?: boolean;
}

const FormInvoice = ({
    invoice,
    setInvoice,
    fieldsEditable = null,
    fieldsForm = null,
    thirdPartyRoleId = '2',
    thirdPartyLabel = 'Proveedor',
    loadAllProducts = false,
}: Props) => {

    const [thirdParties, setThirdParties] = useState<ThirdPartyInterface[] | []>([]);
    const [products, setProducts] = useState<ProductInterface[] | []> ([]);
    const [currencyExchanges, setCurrencyExchanges] = useState<ExchangeRateInterface[] | []>([]);
    const [currencyExchangeRequired, setCurrencyExchangeRequired] = useState<boolean>(false);

    // ----------------------------------------------------------------------------------------------------
    // Datos para transferencias y pagos

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInterface[] | []>([]);
    const [paymentForms, setPaymentForms] = useState<PaymentFormInterface[] | []>([]);
    const [cashPayments, setCashPayments] = useState<any[] | []>([]);
    const [checks, setChecks] = useState<any[] | []>([]);
    const [checkBooks, setCheckBooks] = useState<any[] | []>([]);
    const [bankAccounts, setBankAccounts] = useState<any[] | []>([]);

    // ----------------------------------------------------------------------------------------------------

    const user = useSelector((state: any) => state.user).user;
    const company = user.company;

    // ----------------------------------------------------------------------------------------------------

    const [message, setMessage] = useState<any>({
        message: "",
        type: "",
        show: false,
        time: 3000,
        html: false
    })

    // ----------------------------------------------------------------------------------------------------

    const loadData = async () => {
        const { data } = await fetchHelper.post(base_url(['api/v1/third-parties/search']), {
            length: -1,
            columns: [
                { data: "status.id", searchable: true, search:{value: "1", regex: false} },
                { data: "roles.id", searchable: true, search:{value: thirdPartyRoleId, regex: false} }
            ]
        }, {}, 0, false);
        setThirdParties(data.map((d: any)  => ({
            id: d.id, code: d.thirdPartyCode, name: d.businessName, nit: d.nit, isoCode: d.currencyType.isoCode
        })))

        if(fieldsForm?.paymentsForms) {
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
        }
    }

    const loadDataThirdParty = async () => {
        try{
            const columns = loadAllProducts
                ? []
                : [{ data: "thirdParty.id", searchable: true, search:{ value: invoice.thirdParty.id, regex: false } }];
            const {data} = await fetchHelper.post(base_url(['api/v1/products/page']), {
                length: -1,
                columns,
            }, {}, 0, false);
            setProducts(data.map((d: any) => ({
                id: d.id,
                code: d.code,
                name: d.name,
                price: d.price,
                salePrice: d.salePrice ?? d.price,
                stock: d.stock,
                description: d.description,
            })));
            if(invoice?.thirdParty?.id) {
                setMessage({
                    message: "",
                    type: "",
                    show: false,
                    time: 0,
                    html: false
                })
                setCurrencyExchangeRequired(false);
                if(invoice?.thirdParty?.isoCode !== company.currencyType.isoCode) {
                    setCurrencyExchangeRequired(true);
                    const response = await fetchHelper.post(base_url(['api/v1/exchange-rates/search']), {
                        length: -1,
                        columns: [
                            { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                        ]
                    }, {}, 0, false);
                    if(response.data.length === 0) {
                        setMessage({
                            message: "No existen tipos de cambio de moneda para el proveedor",
                            type: "danger",
                            show: true,
                            time: 0,
                            html: false
                        })
                    }else{
                        setCurrencyExchanges(response.data);
                    }
                }
            }
        }catch(e) {
            setMessage({
                message: "Error al cargar los productos",
                type: "danger",
                show: true,
                time: 3000,
                html: false
            })
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (loadAllProducts) {
            loadDataThirdParty();
            return;
        }
        setProducts([]);
        if (invoice?.thirdParty?.id) {
            loadDataThirdParty();
        }
    }, [invoice?.thirdParty?.id, loadAllProducts]);

    useEffect(() => {
        console.log(invoice, "invoice");
    }, [invoice]);

    return (
        <>
            <AlertPage
                message={message.message}
                type={message.type}
                show={message.show}
                duration={message.time}
                html={message.html}
                onChange={() => setMessage({ message: '', type: '', show: false, time: 3000, html: false })}
            />

            <div className="row">
                {
                    fieldsForm?.thirdPartyId && (
                        <div className={`col-12 col-lg-${currencyExchangeRequired ? '3' : '4'} col-sm-12`}>
                            <InputSelectModal
                                id="thirdPartyId"
                                label={thirdPartyLabel}
                                placeholder={`Selecciona un ${thirdPartyLabel.toLowerCase()}`}
                                labelOption="thirdPartyId"
                                options={thirdParties}
                                value={invoice?.thirdParty?.id}
                                onChange={(value: string) => {
                                    const thirdPartyData = thirdParties.find((d: any) => d.id == value);
                                    setInvoice({
                                        ...invoice,
                                        thirdParty: thirdPartyData,
                                        lineInvoices: value != invoice?.thirdParty?.id ? [] : invoice?.lineInvoices
                                    })
                                }}
                                disabled={fieldsEditable?.thirdPartyId}
                                required={true}
                                error={false}
                            />
                        </div>
                    )
                }
                {
                    fieldsForm?.lineInvoices && (
                        <div className={`col-12 col-lg-${currencyExchangeRequired ? '3' : '4'} col-sm-12`}>
                            <InputSelectModal
                                id="productId"
                                label="Productos"
                                placeholder="Selecciona un producto"
                                labelOption="productId"
                                options={products}
                                value={invoice?.productId}
                                onChange={(value: string) => {
                                    const product = products.find((p: ProductInterface) => p.id == value);
                                    setInvoice({ ...invoice, productId: value, product: product ?? null });
                                }}
                                required={true}
                                error={false}
                                disabled={products.length == 0 || fieldsEditable?.productId}
                            />
                        </div>
                    )
                }

                {
                    fieldsForm?.thirdPartyId && currencyExchangeRequired && (
                        <div className="col-12 col-lg-3 col-sm-12">
                            <InputSelectModal
                                id="currencyExchangeId"
                                label="Tipo de cambio"
                                placeholder="Selecciona un tipo de cambio"
                                labelOption="currencyExchangeId"
                                options={currencyExchanges}
                                value={invoice?.exchangeRate?.id}
                                onChange={(value: string) => {
                                    setInvoice({ ...invoice, exchangeRate: { ...invoice.exchangeRate, id: value } });
                                }}
                                required={true}
                                error={false}
                                disabled={currencyExchanges.length === 0 || fieldsEditable?.currencyExchangeId}
                            />
                        </div>
                    )
                }

                {
                    fieldsForm?.invoiceDate && (
                        <div className={`col-12 mb-2 col-md-${currencyExchangeRequired ? '3' : '4'}`}>
                            <InputDate
                                id="invoiceDate"
                                label={
                                    invoice?.header?.type?.code == "OC" ? 
                                        "Fecha prevista de entrega"
                                        : invoice?.header?.type?.code == "FC" ?
                                        "Fecha de compra"
                                        : invoice?.header?.type?.code == "FV" ?
                                        "Fecha de venta"
                                        : "Fecha"
                                }
                                placeholder="Selecciona una fecha"
                                date={invoice.header.dueDate}
                                dateFormat="Y-m-d"
                                disabled={fieldsEditable?.invoiceDate}
                                onChange={(value: string) => {
                                    setInvoice({ ...invoice, header: { ...invoice.header, dueDate: value } });
                                }}
                                minDate={
                                    invoice?.header?.type?.code == "OC" ?
                                        new Date().toISOString().split('T')[0]
                                        : undefined
                                }
                                maxDate={
                                    invoice?.header?.type?.code == "FC" || invoice?.header?.type?.code == "FV" ?
                                        new Date().toISOString().split('T')[0]
                                        : undefined
                                }
                                required={true}
                                error={false}
                            />
                        </div>
                    )
                }
            </div>

            {
                fieldsForm?.paymentsForms && (
                    <div className="row">
                        <div className="col-12 col-lg-3 col-sm-12">
                            <InputSelectModal
                                id="paymentFormId"
                                label="Forma de pago"
                                placeholder="Selecciona una forma de pago"
                                labelOption="paymentFormId"
                                options={paymentForms}
                                value={invoice?.transaction?.paymentFormId}
                                onChange={(value: string) => {
                                    setInvoice({ ...invoice, transaction: { ...invoice.transaction, paymentFormId: value } })
                                }}
                                required={true}
                                error={false}
                                disabled={paymentForms.length === 0 || fieldsEditable?.paymentFormId}
                            />
                        </div>

                        {
                            invoice?.transaction?.paymentFormId == 1 && (
                                <>
                                    <div className="col-12 col-lg-3 col-sm-12">
                                        <InputSelectModal
                                            id="paymentMethodId"
                                            label="Método de pago"
                                            placeholder="Selecciona un método de pago"
                                            labelOption="paymentMethodId"
                                            options={paymentMethods}
                                            value={invoice?.transaction?.methodPaymentId}
                                            onChange={(value: string) => {
                                                setInvoice({ ...invoice, transaction: { ...invoice.transaction, methodPaymentId: value } })
                                            }}
                                            required={true}
                                            error={false}
                                            disabled={paymentMethods.length === 0 || fieldsEditable?.paymentMethodId}
                                        />
                                    </div>

                                    {
                                        invoice?.transaction?.methodPaymentId == 1 && ( // Cuenta de caja
                                            <>
                                                <div className="col-12 col-lg-3 col-sm-12">
                                                    <InputSelectModal
                                                        id="cashPaymentId"
                                                        label="Cuenta de caja"
                                                        placeholder="Selecciona una cuenta de caja"
                                                        labelOption="cashPaymentId"
                                                        options={cashPayments}
                                                        value={invoice?.transaction?.cashAccount?.id}
                                                        onChange={(value: string) => {
                                                            setInvoice({ ...invoice, transaction: { ...invoice.transaction, cashAccount: { id: value, accountNumber: null } } })
                                                        }}
                                                        required={true}
                                                        error={false}
                                                        disabled={cashPayments.length === 0 || fieldsEditable?.cashPaymentId}
                                                    />
                                                </div>
                                            </>
                                        ) || invoice?.transaction?.methodPaymentId == 2 && ( // Chequera
                                            <>
                                                <div className="col-12 col-lg-3 col-sm-12">
                                                    <InputSelectModal
                                                        id="checkbookId"
                                                        label="Chequera"
                                                        placeholder="Selecciona una chequera"
                                                        labelOption="checkbookId"
                                                        options={checkBooks}
                                                        value={invoice?.transaction?.check?.checkbookId}
                                                        onChange={(value: string) => {
                                                            setInvoice({ ...invoice, transaction: { ...invoice.transaction, check: { checkbookId: value, numberCheck: null } } })
                                                        }}
                                                        required={true}
                                                        error={false}
                                                        disabled={checkBooks.length === 0 || fieldsEditable?.checkbookId}
                                                    />
                                                </div>
                                            </>
                                        ) || invoice?.transaction?.methodPaymentId == 3 && ( // Cheque
                                            <>
                                                <div className="col-12 col-lg-3 col-sm-12">
                                                    <InputSelectModal
                                                        id="checkId"
                                                        label="Cheque"
                                                        placeholder="Selecciona un cheque"
                                                        labelOption="checkId"
                                                        options={checks}
                                                        value={invoice?.transaction?.check?.id}
                                                        onChange={(value: string) => {
                                                            setInvoice({ ...invoice, transaction: { ...invoice.transaction, check: { id: value, numberCheck: null } } })
                                                        }}
                                                        required={true}
                                                        error={false}
                                                        disabled={checks.length === 0 || fieldsEditable?.checkId}
                                                    />
                                                </div>
                                            </>
                                        ) || (
                                            <>
                                                <div className="col-12 col-lg-3 col-sm-12">
                                                    <InputSelectModal
                                                        id="bankAccountId"
                                                        label="Cuenta bancaria"
                                                        placeholder="Selecciona una cuenta bancaria"
                                                        labelOption="bankAccountId"
                                                        options={bankAccounts.filter((d: any) => d.type == (
                                                            invoice?.transaction?.methodPaymentId == 4 ? "CORRIENTE" : 
                                                            invoice?.transaction?.methodPaymentId == 5 ? "AHORROS" : "TARJETA_CREDITO"
                                                        ))}
                                                        value={invoice?.transaction?.bankAccount?.id}
                                                        onChange={(value: string) => {
                                                            setInvoice({ ...invoice, transaction: { ...invoice.transaction, bankAccount: { id: value, accountNumber: null } } })
                                                        }}
                                                        required={true}
                                                        error={false}
                                                        disabled={bankAccounts.length === 0 || fieldsEditable?.bankAccountId}
                                                    />
                                                </div>
                                            </>
                                        )
                                    }
                                </>
                            )
                        }

                        {
                            invoice?.transaction?.paymentFormId == 2 && (
                                <div className="col-12 col-lg-3 col-sm-12">
                                    <InputDate
                                        id="paymentDate"
                                        label="Fecha de pago"
                                        dateFormat="Y-m-d"
                                        placeholder="Selecciona una fecha"
                                        date={invoice?.header?.issueDate}
                                        onChange={(value: string) => {
                                            setInvoice({ ...invoice, header: { ...invoice.header, issueDate: value } })
                                        }}
                                        required={true}
                                        error={false}
                                        disabled={fieldsEditable?.paymentDate}
                                    />
                                </div>
                            )
                        }


                    </div>
                )
            }

            <div className="row">
                <div className="col-12 col-sm-12">
                    <TextareaModal
                        id="notes"
                        label="Notas"
                        value={invoice.notes}
                        onChange={(value: string) => {
                            setInvoice({ ...invoice, notes: value })
                        }}
                        error={false}
                        placeholder="Ingrese las notas"
                        required={false}
                    />
                </div>
            </div>
        </>
    )
}

export default FormInvoice;