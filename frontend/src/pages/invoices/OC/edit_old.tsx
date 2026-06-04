import AlertPage from "@/components/molecules/AlertPage";
import InputDate from "@/components/molecules/InputDate";
import InputSelectModal from "@/components/molecules/inputSelectModal";
import TextareaModal from "@/components/molecules/TextareaModal";
import DataTableReference from "@/components/organism/DataTable";
import PageLoad from "@/pages/errors/page_load";
import { fetchHelper } from "@/utils/fetch";
import { adjustCurrency, base_url, formatDate, formatPrice, generateInvoiceCode, normalizeDate } from "@/utils/functions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import TaxRetentionDetail from "../lineInvoiceDetail/taxRetencion";
import TotalsInvoice from "../details/totals";
import { InvoiceInterface } from "../interfaces/invoice.interface";

const UpdateOC = () => {

    const user = useSelector((state: any) => state.user).user;
    const company = user.company;

    const modal = useRef(null);
    const modalInstance = useRef(null);
    
    const tableRef = useRef(null);
    const dataTableRef = useRef(null);
    const [reload, setReload] = useState(0);
    const [requireds, setRequireds] = useState([
        {
            id: "thirdPartyId",
            required: true,
            message: "El proveedor es requerido"
        },{
            id: "invoiceDate",
            required: true,
            message: "La fecha prevista de entrega es requerida"
        },{
            id: "lineInvoices",
            required: true,
            message: "Necesita agregar al menos un item a la factura"
        }
    ]);
    const [errors, setErrors] = useState({});
    
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<InvoiceInterface>(null);
    const [lineInvoices, setLineInvoices] = useState([]);
    const [isSending, setIsSending] = useState(false);

    const [thirdParties, setThirdParties] = useState([]);
    const [assets, setAssets] = useState([]);
    const [exchangeRates, setExchangeRates] = useState([]);
    const [rulesTax, setRulesTax] = useState([]);
    const [item, setItem] = useState(null);

    const [paymentForms, setPaymentForms] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const [accountBanks, setAccountBanks] = useState([]);
    const [checkboxes, setCheckboxes] = useState([]);
    const [cash, setCash] = useState([]);   

    const [message, setMessage] = useState({
        message: "",
        type: "",
        show: false,
        duration: 3000,
    });
    const [messageItem, setMessageItem] = useState({
        message: "",
        type: "",
        show: false,
        duration: 0,
    });

    useEffect(() => {
        const fetchInvoice = async () => {
            const url = base_url(["api/v1/invoices", id]);
            try{
                const {data} = await fetchHelper.get(url, {}, 1);
                setInvoice({
                    header: {
                        type: {
                            code: data.header.type.code,
                            codeNumber: data.header.type.codeNumber,
                            name: data.header.type.name
                        },
                        documentId: data.header.documentId,
                        issueDate: data.header.issueDate,
                        dueDate: data.header.dueDate,
                        total: data.header.total,
                        status: data.header.status
                    },
                    thirdParty: {
                        id: data.thirdParty.id,
                        nit: data.thirdParty.nit,
                        name: data.thirdParty.businessName,
                        address: data.thirdParty.address,
                        city: data.thirdParty.city,
                        country: data.thirdParty.country,
                        email: data.thirdParty.email
                    },
                    lineInvoices: data.lineInvoices.map(li => ({
                        id: li.id,
                        productId: li.productId,
                        asset: li.asset,
                        code: li.code,
                        name: li.name,
                        description: li.description,
                        quantity: li.quantity,
                        price: li.price,
                        taxRulesIds: li.taxRulesIds,
                        retentions: li.retentions,
                        discount: li.discount,
                        isDeleted: li.isDeleted
                    })),
                    notes: data.notes,
                    exchangeRate: data.exchangeRate,
                    productId: data.productId
                });
                const loadData = async () => {
                    const thirdPartiesRes = await fetchHelper.post(base_url(['api/v1/third-parties/search']), {
                        length: -1,
                        columns: [
                            { data: "id", searchable: true, search:{value: data.thirdParty.id, regex: false} }
                        ]
                    }, {}, 0, false);
                    const thirdParty = thirdPartiesRes.data.find(t => t.id === data.thirdParty.id);
                    setInvoice(
                        prev => ({
                            ...prev,
                            thirdParty: thirdParty
                        })
                    );
                    setThirdParties(thirdPartiesRes.data);
                    setRequireds(requireds.filter(r => r.id !== 'exchangeRateId'));
                    if(company.currencyType.isoCode !== invoice?.thirdParty?.currencyType?.isoCode) {
                        const {data: exchangeRateResponse} = await 
                        fetchHelper.post(base_url(['api/v1/exchange-rates/search']), {
                            length: -1,
                            columns: [
                                { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                                { data: "currencyExchanged.isoCode", searchable: true,
                                    search:{value: company.currencyType.isoCode, regex: false}
                                },
                                { data: "currencyExchange.isoCode", searchable: true,
                                    search:{value: invoice?.thirdParty?.currencyType?.isoCode, regex: false}
                                }
                            ]
                        }, {}, 0, false);

                        const now = normalizeDate().localDate;
                        const exchangeRates = exchangeRateResponse?.filter(e => {
                            const dateStart = normalizeDate(e.startDate).localDate;
                            const dateEnd = normalizeDate(e.endDate).localDate;
                            return (dateStart <= now && dateEnd >= now) || data.exchangeRate.id == e.id;
                        });

                        setExchangeRates(exchangeRates || []);
                        setRequireds((prev) => [
                            ...prev,
                            {
                                id: "exchangeRateId",
                                required: true,
                                message: "Necesita seleccionar una tasa de cambio"
                            }
                        ])
                    }
                    const {data: assetsRes} = await fetchHelper.post(base_url(['api/v1/assets/search']), {
                        length: -1,
                        columns: [
                            { data: "supplier.id", searchable: true, search:{value: data.thirdParty.id, regex: false} },
                            { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                        ]
                    }, {}, 0, false);

                    const newAssets = data.lineInvoices.filter(li => li.asset == null).map(li => ({
                        id: li.name,
                        name: li.name,
                        description: li.description,
                        quantity: li.quantity,
                        asset: null
                    }));
                    setAssets([
                        ...assetsRes,
                        ...newAssets
                    ]);

                    const {data: rulesTaxResponse} = await fetchHelper.post(base_url(['api/v1/ruler-tax/search']), {
                        length: -1,
                        columns: [
                            { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                        ]
                    }, {}, 0, false);
                    setRulesTax(rulesTaxResponse || []);

                    if(data.invoiceState.code === "SENT"){
                        const {data} = await fetchHelper.post(base_url(['api/v1/resources/payment-forms']),
                            {
                                length: -1,
                                columns: [
                                    { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                                ]
                            }, {}, 0, false);
                        setPaymentForms(data || []);

                        const {data: paymentMethodsResponse} = await fetchHelper.post(base_url(['api/v1/resources/payment-methods']),
                            {
                                length: -1,
                                columns: [
                                    { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                                ]
                            }, {}, 0, false);
                        setPaymentMethods(paymentMethodsResponse || []);

                        const {data: accountBanksResponse} = await fetchHelper.post(base_url(['api/v1/bank-accounts/search']),
                            {
                                length: -1,
                                columns: [
                                    { data: "status", searchable: true, search:{value: "ACTIVA", regex: false} },
                                ]
                            }, {}, 0, false);
                        setAccountBanks(accountBanksResponse || []);

                        setPaymentMethods(prev =>
                            prev.map(pm => ({
                                ...pm,
                                disabled:
                                    pm.code === "CREDIT_CARD"
                                        ? accountBanksResponse.filter(ab => ab.accountType === "TARJETA_CREDITO").length === 0
                                    : pm.code === "ACCOUNT_CURRENT"
                                        ? accountBanksResponse.filter(ab => ab.accountType === "CORRIENTE").length === 0
                                    : pm.code === "ACCOUNT_SAVINGS"
                                        ? accountBanksResponse.filter(ab => ab.accountType === "AHORROS").length === 0
                                    : false
                            }))
                        );

                        const {data: checkboxesResponse} = await fetchHelper.post(base_url(['api/v1/banks/checkbooks/search']),
                            {
                                length: -1,
                                columns: [
                                    { data: "status", searchable: true, search:{value: "ACTIVA", regex: false} },
                                ]
                            }, {}, 0, false);
                        setCheckboxes(checkboxesResponse || []);
                        
                        const {data: cashResponse} = await fetchHelper.post(base_url(['api/v1/cash/search']),
                            {
                                length: -1,
                                columns: [
                                    { data: "cashStatus", searchable: true, search:{value: "ACTIVE", regex: false} },
                                ]
                            }, {}, 0, false);
                        setCash(cashResponse || []);
                    }
                }
                loadData();

            } catch (error) {
                console.error(error);
                const msg = error.msg || error.message || "Error al obtener la orden de compra";
                setMessage({
                    message: msg,
                    type: "danger",
                    show: true,
                    duration: 0,
                });
            } finally {
                setReload(prev => prev + 1)
            }
        };
        fetchInvoice();
    }, [id]);

    useEffect(() => {
        setErrors({});
        if(invoice?.lineInvoices && lineInvoices.length == 0){
            setLineInvoices(invoice.lineInvoices.map(li => ({
                ...li,
                asset: li.asset ?? {id: li.name, name: li.name, description: li.description}
            })));
        }
        setReload(prev => prev + 1)
    }, [invoice, assets, invoice?.exchangeRateId]);

    useEffect(() => {
        if(invoice?.assetId) {
            let lineInvoicesData = [...(lineInvoices || [])];
            const assetData = assets.find(a => a.id == invoice.assetId);
            const assetItem = lineInvoicesData.find(a => a.asset?.id == invoice.assetId);

            if(!assetItem && !assetData) { // Si no existe en los lineInvoices y es nuevo
                const item = {
                    id: null,
                    asset: {id: invoice.assetId, name: invoice.assetId, description: "Nuevo"},
                    name: invoice.assetId,
                    description: 'Nuevo',
                    quantity: 1,
                    price: 1,
                    discount: { percentage: 0, value: 0 },
                    taxRulesIds: [],
                    retentions: [],
                    limit: null
                }
                lineInvoicesData.push(item);
                setAssets(prev => [...prev, item]);
            }else if(!assetItem && assetData){ // Si no existe en los lineInvoices y no es nuevo
                lineInvoicesData.push({
                    id: null,
                    asset: assetData.asset,
                    name: assetData.name,
                    description: assetData.description,
                    price: (assetData.acquisitionValue || 0) + (assetData.taxValue || 0),
                    quantity: 1,
                    taxRulesIds: [],
                    retentions: [],
                    discount: { percentage: 0, value: 0 },
                    limit: null
                });
            }else { // Si existe en los lineInvoices
                lineInvoicesData = lineInvoicesData.map(item =>
                    item.asset.id === assetItem.asset.id
                      ? { ...item, quantity: item.isDeleted ? 1 : item.quantity + 1, isDeleted: false }
                      : item
                );
            }
            setInvoice(prev => ({
                ...prev,
                lineInvoices: lineInvoicesData,
                assetId: null
            }));
            setLineInvoices(lineInvoicesData);
        }
    }, [invoice?.assetId]);

    useEffect(() => {
        const tableDT = dataTableRef?.current;
        if(!tableDT) return;
    
        const handler = (e) => {
            if (e.target.matches(".change-data")) {
    
                const el = e.target;
                const { id, field } = el.dataset;
                let value =
                    field == "quantity" || field == "price" ?
                    (el.value >= 0 ? Number(el.value) : 0) : el.value;

                if(invoice.invoiceState.code === "SENT"){
                    const lineInvoice = lineInvoices.find(li => li.asset.id == id);
                    if(lineInvoice.limit != null){
                        value = value > lineInvoice.limit ? lineInvoice.limit : value;
                    }
                }

                setLineInvoices(prev =>
                    prev.map(item =>
                        item.asset?.id == id
                            ? { ...item, [field]: value }
                            : item
                    )
                );
            }
        };

        const handlerBtn = function(){
            const action = $(this).data("action");
            const id = $(this).data("id");
            switch(action){
                case "taxRetention":
                    if(!modalInstance.current) {
                        modalInstance.current = new window.bootstrap.Modal(modal.current);
                    }
                    const itemData = lineInvoices.find(li => li?.asset?.id == id);

                    if(itemData){
                        setItem(itemData || null);
                        modalInstance.current.show();
                    }
                    break;
                case "remove":
                    setLineInvoices(prev =>
                        prev.flatMap(li => {
                            if (li?.asset?.id != id) return [li];
                            // si no existe en DB → eliminar
                            if (!li.id) return [];
                            // si existe → marcar como eliminado
                            return [{ ...li, isDeleted: true }];
                        })
                    );
                    break;
                default:
                    break;
            }
        }
    
        tableDT.on("change", handler);
        tableDT.on('click', '.action-btn', handlerBtn);
    
        return () => {
            tableDT.off("change", handler);
            tableDT.off('click', '.action-btn', handlerBtn);
        };
    
    }, [invoice?.lineInvoices]); // ✅ SOLO UNA VEZ

    useEffect(() => {
        const tableDT = dataTableRef?.current;
        if(!tableDT) return;

        setInvoice(prev => ({
            ...prev,
            lineInvoices: lineInvoices
        }));

        console.log(lineInvoices, "LineInvoices edit");

        setReload(prev => prev + 1)
    }, [lineInvoices]);

    const columns = useMemo(() => [
        {
            title: "Nombre",
            data: 'name',
            render: (name, _, full) => {
                return full?.asset?.name ?? name ?? full.description ?? '';
            }
        },{
            title: "Descripción",
            data: "description"
        },{
            title: "Cantidad",
            data: "quantity",
            render: (q,_,full) => {
                return `
                    <input
                        type="number"
                        class="form-control form-control-sm change-data"
                        data-id="${full?.asset.id}"
                        data-field="quantity"
                        value="${q}">
                `;
            }
        },{
            title: `Precio ${invoice?.thirdParty?.currencyType?.isoCode ?? ""}`,
            data: "price",
            render: (q,_,full) => {
                return invoice.invoiceState.id === 1 ?
                `
                    <input
                        type="number"
                        class="form-control form-control-sm change-data"
                        data-id="${full.asset.id}"
                        data-field="price"
                        value="${q}">
                ` : formatPrice(q, invoice?.thirdParty?.currencyType?.isoCode);
            }
        },{
            data: 'id',
            title: `Sub Total ${invoice?.thirdParty?.currencyType?.isoCode || ''} (BRUTO)`,
            render: (data, type, full) => {
                const prices = full.price * full.quantity;
        
                return formatPrice(prices, invoice?.thirdParty?.currencyType?.isoCode);
            },
            visible: invoice?.exchangeRateId !== undefined,
        },{
            title: `Sub Total ${company.currencyType.isoCode} (BRUTO)`, render: (data, type, full, meta) => {
                const prices = full.price * full.quantity;
                const exchangeRate = exchangeRates.find(e => e.id === Number(invoice?.exchangeRateId))
                if(exchangeRate?.value !== undefined) {
                    const adjustedSubtotal = adjustCurrency({
                        price: prices,
                        fromCurrency: invoice?.thirdParty?.currencyType?.isoCode,
                        toCurrency: company.currencyType.isoCode,
                        exchangeRate: exchangeRate.value
                    });
                    return formatPrice(adjustedSubtotal, company.currencyType.isoCode);
                }
                return formatPrice(prices, company.currencyType.isoCode);
            }
        },{
            data: 'id', width: '150px', title: 'Acciones', render: (data, type, full, meta) => {
            return `
                <a class="btn btn-label-success btn-sm mx-1 me-2 action-btn" href="javascript:void(0)" data-action="taxRetention" data-id="${full.asset.id}">
                    <i class="ri-currency-line"></i>
                </a>
                <a class="btn btn-label-danger btn-sm mx-1 me-2 action-btn" href="javascript:void(0)" data-action="remove" data-id="${full.asset.id}">
                    <i class="ri-close-circle-line"></i>
                </a>
            `;
        }}
    ], [invoice, exchangeRates]);

    const handleSend = async () => {
        try{
            setMessage({ message: '', type: '', show: false, time: 0 });
            setErrors({});
            let newErrors = {};
            let isValid = true;

            requireds.forEach(required => {
                const value = invoice[required.id];
                if (
                    value === undefined ||
                    (required.required && (!value || (Array.isArray(value) && value.length === 0)))
                ) {
                    newErrors[required.id] = required.message;
                    isValid = false;
                }
            });
            setErrors(newErrors);
            if(!isValid) return;
            if(invoice?.thirdParty?.typeRegimen?.code === 'RESPONSABLE_IVA') {
                if(!invoice.lineInvoices?.some(item => item.taxRulesIds?.length)) {
                    setMessageItem({ message: 'Necesita agregar una regla de impuesto para cada item', type: 'warning', show: true, time: 0 });
                    isValid = false;
                }
            }
            if(!isValid) return;

            let url = '';
            let response = null;
            let messageSuccess = '';
            switch(invoice.invoiceState.code){
                case 'PENDING_APPROVAL':
                    url = base_url(["api/v1/invoices/oc", id]);
                    response = await fetchHelper.put(url, invoice, {}, 500, false);
                    messageSuccess = 'Orden de compra aprobada correctamente';
                    break;
                case 'SENT':
                    url = base_url(["api/v1/invoices/oc/received", id]);
                    response = await fetchHelper.post(url, invoice, {}, 500, false);
                    messageSuccess = 'Orden de compra recibida correctamente';
                    break;
                case 'PARTIALLY_RECEIVED':
                    break;
                case 'RECEIVED':
                    break;
                default:
                    break;
            }
            window.Swal.fire({
                title: messageSuccess,
                text: response?.message || messageSuccess,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                customClass: {
                    confirmButton: 'btn btn-primary waves-effect'
                },
                allowOutsideClick: false,
                showConfirmButton: true,
                showCancelButton: false,
                showCloseButton: false,
            }).then((result) => {
                if(result.isConfirmed) {
                    navigate(-1);
                }
            });
        } catch (error) {
            console.error(error);
            const msg = error.msg || error.message || "Error al actualizar la orden de compra";
            setMessage({ message: msg, type: "danger", show: true, duration: 0 });
        }
    }

    if(!invoice) return <PageLoad />;

    return (
        <>
            <div className="card h-100">
                <div className="card-header">

                    <h4 className={`text-center border-bottom border-2 pb-2`}>
                        {
                            invoice.invoiceState.id === 1 ? <span>Actualizar</span>
                                : invoice.invoiceState.id === 4 || invoice.invoiceState.id === 5 ? <span>Recibir orden de compra</span> : <span>Aprobado</span>
                        }
                    </h4>

                    <div className="row d-flex justify-content-between align-items-center">
                        <div className="col-12 col-md-10">
                            
                            <h5 className="card-title mb-1">{invoice.typeInvoice.name}</h5>
                            <p className="card-subtitle mb-0">{generateInvoiceCode(invoice.typeInvoice.code, invoice.resolution)}</p>
                        </div>
                        <div className="col-12 col-md-2">
                            <button className="btn btn-secondary me-2" onClick={() => navigate(-1)}>
                                <i className="ri-arrow-left-line"></i> Volver
                            </button>
                        </div>
                    </div>

                    <AlertPage
                        type={message.type}
                        message={message.message}
                        show={message.show}
                        onChange={() => setMessage({ message: '', type: '', show: false, duration: 3000 })}
                        duration={message.duration}
                    />
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className={`
                            mb-2 col-12 col-md-${requireds.some(required => required.id === 'exchangeRateId' && required.required)
                            ? '3' : '4'}`
                        }>
                            <InputSelectModal
                                id="thirdPartyId"
                                label="Proveedor"
                                placeholder="Selecciona un proveedor"
                                name="thirdPartyId"
                                options={thirdParties.map(t => ({label: `${t.businessName} - ${t.thirdPartyCode}`, id: t.id}))}
                                value={invoice.thirdPartyId}
                                onChange={(value) => {
                                    setInvoice({ ...invoice, thirdPartyId: Number(value) })
                                    setErrors({ ...errors, thirdPartyId: undefined });
                                }}
                                required={requireds.some(required => required.id === 'thirdPartyId' && required.required)}
                                error={errors.thirdPartyId}
                                disabled={true}
                            />
                        </div>
                        <div className={`
                            mb-2 col-12 col-md-${requireds.some(required => required.id === 'exchangeRateId' && required.required)
                            ? '3' : '4'}`
                        }> 
                            <InputSelectModal
                                id="assetId"
                                label="Activo"
                                placeholder="Selecciona un activo"
                                name="assetId"
                                options={assets.map(a => ({label: `${a.name} - ${a.asset?.assetCode ?? a.description}`, id: a.id}))}
                                value={invoice.assetId}
                                onChange={(value) => setInvoice({ ...invoice, assetId: value })}
                                newOption={true}
                            />
                        </div>
                        {
                            company.currencyType.isoCode !== invoice?.thirdParty?.currencyType?.isoCode && (
                                <div className="mb-2 col-12 col-md-3">
                                    <InputSelectModal
                                        id="exchangeRateId"
                                        label="Tasa de cambio"
                                        placeholder="Selecciona una tasa de cambio"
                                        name="exchangeRateId"
                                        value={invoice.exchangeRateId}
                                        onChange={(value) => setInvoice({ ...invoice, exchangeRateId: value })}
                                        options={exchangeRates
                                            .map(e => ({
                                                label: `${e.currencyExchange.isoCode} a ${e.currencyExchanged.isoCode} - ${formatPrice(e.value, e.currencyExchanged.isoCode)}`,
                                                id: e.id}
                                            ))}
                                        required={requireds.some(required => required.id === 'exchangeRateId' && required.required)}
                                        error={errors.exchangeRateId}
                                        disabled={
                                            invoice.invoiceState.code === 'SENT'
                                            || invoice.invoiceState.code === 'PARTIALLY_RECEIVED'
                                            || invoice.invoiceState.code === 'RECEIVED'
                                        }
                                    />
                                </div>
                            )
                        }
                        <div className={`
                            mb-2 col-12 col-md-${requireds.some(required => required.id === 'exchangeRateId' && required.required)
                            ? '3' : '4'}`
                        }> 
                            <InputDate
                                id="invoiceDate"
                                label="Fecha prevista de entrega"
                                placeholder="Selecciona una fecha"
                                name="invoiceDate"
                                date={invoice.invoiceDate}
                                dateFormat="Y-m-d"
                                onChange={(value) => setInvoice({ ...invoice, invoiceDate: value })}
                                required={requireds.some(required => required.id === 'invoiceDate' && required.required)}
                                error={errors.invoiceDate}                                
                                minDate={normalizeDate().localDate}
                                disabled={
                                    invoice.invoiceState.code === 'SENT'
                                    || invoice.invoiceState.code === 'PARTIALLY_RECEIVED'
                                    || invoice.invoiceState.code === 'RECEIVED'
                                }
                            />
                        </div>
                    </div>
                    {
                        invoice.invoiceState.code === "SENT" && (
                            <>
                                <div className="row">
                                    <div className="mb-2 col-12 col-md-4">
                                        <InputSelectModal
                                            id="paymentFormId"
                                            label="Forma de pago"
                                            placeholder="Selecciona una forma de pago"
                                            name="paymentFormId"
                                            options={paymentForms.map(p => ({label: p.name, id: p.id}))}
                                            value={invoice.paymentFormId}
                                            onChange={(value) => setInvoice({ ...invoice, paymentFormId: value })}
                                        />
                                    </div>
                                    {
                                        invoice.paymentFormId == 1 && (
                                            <>
                                                <div className="mb-2 col-12 col-md-4">
                                                    <InputSelectModal
                                                        id="paymentMethodId"
                                                        label="Método de pago"
                                                        placeholder="Selecciona un método de pago"
                                                        name="paymentMethodId"
                                                        options={paymentMethods.map(p => ({label: p.name, id: p.id, disabled: p.disabled}))}
                                                        value={invoice.paymentMethodId}
                                                        onChange={(value) => setInvoice({ ...invoice, paymentMethodId: value })}
                                                    />
                                                </div>
                                                <div className="col-12 col-md-4 mb-4">
                                                    <InputSelectModal
                                                        id="originPaymentId"
                                                        label="Origen de pago"
                                                        value={ invoice.originPaymentMethodId } 
                                                        onChange={(value) =>{
                                                            setInvoice({ ...invoice, originPaymentMethodId: value })
                                                        }
                                                        }
                                                        options={
                                                            invoice.paymentMethodId == 1 || invoice.paymentMethodId == 4 ? cash.map(c => ({ id: c.id, label: `${c.cashCode} - ${c.cashName}` })) :
                                                            invoice.paymentMethodId == 2 ? checkboxes.map(c => ({ id: c.id, label: `${c.numberCheck} - ${c.beneficiary}` })) :
                                                            paymentMethods.find(pm => pm.code == "ACCOUNT_SAVINGS" || pm.code == "ACCOUNT_CURRENT" || pm.code == "CREDIT_CARD").length > 0 ? accountBanks
                                                            .map(b => ({ id: b.id, label: `${b.accountName} - ${b.accountNumberMasked}` })) :
                                                            []
                                                        }
                                                    />
                                                </div>
                                            </>
                                        )
                                    }
                                </div>
                            </>
                        )
                    }
                    <div className="row">
                        <div className="mb-2 col-12 col-md-12">
                            <TextareaModal
                                id="notes"
                                label="Notas"
                                placeholder="Notas de la orden de compra"
                                name="notes"
                                value={invoice.notes}
                                onChange={(value) => {
                                    setInvoice({ ...invoice, notes: value });
                                    setErrors({ ...errors, notes: undefined });
                                }}
                                error={errors.notes}
                                required={requireds.some(required => required.id === 'notes' && required.required)}
                            />
                        </div>
                    </div>
                    {/* {
                        invoice.invoiceState.id === 1 && (
                        ) || (
                            <>
                                <div className="row">
                                    <table className="table table-bordered table-responsive table-sm">
                                        <thead>
                                            <tr>
                                                <th colSpan={3} className="text-center">
                                                    Orden de Compra: {invoice?.typeInvoice.code}-{invoice?.resolution}
                                                    
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><b>Tercero: </b><br/>{invoice.thirdParty.businessName}</td>
                                                <td><b>Fecha de emisión: </b><br/>{formatDate(invoice.createdAt)}</td>
                                                <td><b>Fecha de prevista de entrega: </b><br/>{formatDate(invoice.invoiceDate, 'DD-MM-YYYY')}</td>
                                            </tr>
                                            <tr>
                                                <td><b>Valor: </b><br/>{formatPrice(invoice.totalAmount, company.currencyType.isoCode)}</td>
                                                <td><b>Impuesto: </b><br/>{formatPrice(invoice.totalTax, company.currencyType.isoCode)}</td>
                                                <td><b>Descuentos: </b><br/>{formatPrice(invoice.totalDiscount, company.currencyType.isoCode)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={!invoice.exchangeRate ? 3 : 1}><b>Total: </b><br/>{formatPrice(invoice.totalPayment, company.currencyType.isoCode)}</td>
                                                {invoice.exchangeRate && (
                                                    <>
                                                        <td><b>Tasa de cambio:</b>
                                                        <br/>{invoice.exchangeRate.currencyType.isoCode} a {invoice.exchangeRate.currencyTypeTarget.isoCode}</td>
                                                        <td><b>Valor de cambio: </b><br/>{formatPrice(invoice.exchangeRate.rate, invoice.exchangeRate.currencyTypeTarget.isoCode)}</td>
                                                    </>
                                                )}
                                            </tr>
                                            <tr>
                                                <td colSpan={3}><b>Notas: </b><br/>{invoice.notes}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )
                    } */}
                </div>

            </div>

            <div className="card h-100">
                <div className="card-body">
                    <AlertPage
                        type={messageItem.type}
                        message={messageItem.message}
                        show={messageItem.show}
                        onChange={() => setMessageItem({ message: '', type: '', show: false, duration: 3000 })}
                        duration={messageItem.duration}
                    />
                    <div className="card-datatable invoice-table">
                        <DataTableReference
                            tableRef={tableRef}
                            dataTableRef={dataTableRef}
                            columns={columns}
                            data={lineInvoices.filter(li => !li.isDeleted)}
                            buttons={[]}
                            reload={reload}
                        />
                    </div>

                </div>
            </div>

            <TotalsInvoice
                invoice={invoice} 
                company={company}
                exchangeRate={exchangeRates.find(e => e.id === invoice?.exchangeRateId)}
                send={handleSend}
                isSending={isSending}
            />

            <TaxRetentionDetail
                modalRef={modal}
                modalInstance={modalInstance}
                thirdParty={invoice?.thirdParty}
                rules={rulesTax}
                item={item}
                setItem={setItem}
                onchange={(() => {
                    setLineInvoices(prev =>
                        prev.map(itemD => {
                            if (itemD.asset?.id === item?.asset?.id) {
                                return item;
                            }
                            return itemD;
                        })
                    );
                    if(modalInstance.current) {
                        modalInstance.current.hide();
                    }
                })}
            />
        </>
    );
};

export default UpdateOC;