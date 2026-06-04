import Button from "@/components/atoms/Button";
import AlertPage from "@/components/molecules/AlertPage";
import InputDate from "@/components/molecules/InputDate";
import InputModal from "@/components/molecules/InputModal";
import InputSelectModal from "@/components/molecules/inputSelectModal";
import TextareaModal from "@/components/molecules/TextareaModal";
import DataTableReference from "@/components/organism/DataTable";
import { fetchHelper } from "@/utils/fetch";
import { adjustCurrency, base_url, formatPrice, generateInvoiceCode, normalizeDate } from "@/utils/functions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { InvoiceInterface, LineInvoiceInterface } from "@/pages/invoices/interfaces/invoice.interface";

import TaxRetentionDetail from "../lineInvoiceDetail/taxRetencion"

import "@/styles/invoices.css";
import TotalsInvoice from "../details/totals";

const CreateOC = () => {
    const user = useSelector((state: any) => state.user).user;
    const company = user.company;

    const navigate = useNavigate();
    const location = useLocation();

    const modalRulesTaxRef = useRef(null);
    const modalRulesTaxInstance = useRef(null);
    const table = useRef(null);
    const dataTable = useRef(null);
    const [reload, setReload] = useState(0);
    const [requireds, setRequireds] = useState([{
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
    },{
        id: "exchangeRateId",
        required: false,
        message: "El tipo de cambio es requerido"
    }]);
    const [currencyExchangeRequired, setCurrencyExchangeRequired] = useState(false);
    
    const [errors, setErrors] = useState({
        lineInvoices: '',
        thirdParty: '',
        invoiceDate: '',
        exchangeRateId: ''
    });

    const [message, setMessage] = useState({ message: '', type: '', show: false, time: 3000, html: false });
    const [messageItem, setMessageItem] = useState({ message: '', type: '', show: false, time: 3000, html: false });
    const [invoice, setInvoice] = useState<InvoiceInterface>({
        id: null,
        header: {
            type: {
                code: '',
                codeNumber: 0,
                name: ''
            },
            documentId: '',
            issueDate: '',
            dueDate: '',
            status: 'PENDING',
            serial: "X"
        },
        values: {
            totalPayment: 0,
            totalAmount: 0,
            totalDiscount: 0,
            totalTax: 0
        },
        state: null,
        thirdParty: {
            id: '',
            code: '',
            nit: '',
            name: '',
            dv: '',
            address: '',
            city: '',
            country: '',
            email: '',
            isoCode: ''
        },
        lineInvoices: [],
        notes: '',
        exchangeRate: null,
        productId: null,
        product: null,
        transaction: null,
        vouchers: []
    });
    const [isSending, setIsSending] = useState(false);
    const [thirdParty, setThirdParty] = useState(null);
    const [item, setItem] = useState(null);
    const [exchangeRate, setExchangeRate] = useState(null);

    // Consulta de recursos
    const [thirdParties, setThirdParties] = useState([]);
    const [products, setProducts] = useState([]);

    const [rulesTax, setRulesTax] = useState([]);
    const [exchangeRates, setExchangeRates] = useState([]);

    const loadResources = async () => {
        try {
            const [thirdPartiesResponse, rulesTaxResponse, exchangeRatesResponse] = await Promise.allSettled([
                fetchHelper.post(base_url(['api/v1/third-parties/search']), {
                    length: -1,
                    columns: [
                        { data: "status.id", searchable: true, search:{value: "1", regex: false} },
                        { data: "roles.id", searchable: true, search:{value: "2", regex: false} }
                    ]
                }, {}, 0, false),
                fetchHelper.post(base_url(['api/v1/ruler-tax/search']), {
                    length: -1,
                    columns: [
                        { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                    ]
                }, {}, 0, false),
                fetchHelper.post(base_url(['api/v1/exchange-rates/search']), {
                    length: -1,
                    columns: [
                        { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                    ]
                }, {}, 0, false)
            ]);
            if(thirdPartiesResponse.status === 'fulfilled') {
                setThirdParties(thirdPartiesResponse.value?.data || []);
            }else{
                throw new Error(thirdPartiesResponse.reason.msg || 'Error al cargar los terceros');
            }

            if(rulesTaxResponse.status === 'fulfilled') {
                const now = normalizeDate().localDate;
                const rulesTax = rulesTaxResponse.value.data?.filter(r => {
                    return normalizeDate(r.startDate, { endOfDay: false }).localDate <= now && normalizeDate(r.endDate, { endOfDay: true }).localDate >= now;
                });
                setRulesTax(rulesTax || []);
            }else{
                throw new Error(rulesTaxResponse.reason.msg || 'Error al cargar las reglas de impuesto');
            }

            if(exchangeRatesResponse.status === 'fulfilled') {
                const now = normalizeDate().localDate;
                const exchangeRates = exchangeRatesResponse.value.data?.filter(e => {
                    return normalizeDate(e.startDate, { endOfDay: false }).localDate <= now && normalizeDate(e.endDate, { endOfDay: true }).localDate >= now;
                });
                setExchangeRates(exchangeRates || []);
            }else{
                throw new Error(exchangeRatesResponse.reason.msg || 'Error al cargar los tipos de cambio');
            }
        } catch (error) {
            console.log(error);
            setMessage({ message: error.msg || error.message || 'Error al cargar los recursos', type: 'danger', show: true, time: 0, html: false });
        }
    };

    useEffect(() => {
        console.log(invoice, "invoice");
    }, [invoice]);

    useEffect(() => {
        if(invoice.productId) {
            let lineInvoices = [...(invoice.lineInvoices || [])];
            const productData = products.find(p => p.id == invoice.productId);
            const productItem = lineInvoices.find(p => p.product?.id == invoice.productId);

            if(!productItem && !productData) { // Si no existe en los lineInvoices y es nuevo
                const item: LineInvoiceInterface = {
                    id: crypto.randomUUID(),
                    productId: invoice.productId,
                    asset: null,
                    // asset: {id: null, name: invoice.asset, description: 'Nuevo', code: ''},
                    product: null,
                    name: String(invoice.productId),
                    description: 'Nuevo',
                    price: 1,
                    quantity: 1,
                    taxRulesIds: [],
                    retentions: [],
                    discount: { percentage: 0, value: 0 },
                    code: '',
                    isDeleted: false
                }
                lineInvoices.push(item);
                setProducts(prev => [...prev, item]);
            }else if(!productItem && productData){ // Si no existe en los lineInvoices y no es nuevo
                lineInvoices.push({
                    id: crypto.randomUUID(),
                    asset: null,    
                    // asset: {id: assetData.id, name: assetData.name, description: assetData.description},
                    product: {
                        id: productData.id,
                        name: productData.name,
                        description: productData.description,
                        code: productData.code,
                        stock: productData.stock || null,
                        price: productData.price || null
                    },
                    productId: productData.id,
                    name: productData.name,
                    description: productData.description,
                    price: productData.price,
                    quantity: 1,
                    taxRulesIds: [],
                    retentions: [],
                    discount: { percentage: 0, value: 0 },
                    code: productData.code,
                    isDeleted: false
                  });
            }else {
                lineInvoices = lineInvoices.map(item =>
                    item.product?.id === productItem.product?.id
                      ? { ...item, quantity: item.quantity + 1 }
                      : item
                );
            }
            setInvoice(prev => ({
                ...prev,
                lineInvoices,
                productId: null,
                product: null,
            }));
        }
    }, [invoice.productId]);

    useEffect(() => {
        const tableDT = dataTable?.current;
        if(!tableDT) return;
    
        const handler = (e) => {
            if (e.target.matches(".change-data")) {
    
                const el = e.target;
                const { id, field } = el.dataset;
                let value = el.value;

                if(field === 'price' || field === 'quantity') {
                    value = Number(value) < 0 ? 1 : Number(value);
                }

                setInvoice(prev => ({
                    ...prev,
                    lineInvoices: prev.lineInvoices.map(item =>
                        item.id === id
                            ? { ...item, [field]: value }
                            : item
                    )
                }));
            }
        };

        const handlerBtn = function(){
            const action = $(this).data("action");
            const id = $(this).data("id");
            const item = invoice.lineInvoices?.find((i: LineInvoiceInterface) => i.id === id);
            if(!item) {
                console.warn("Item no encontrado", id);
                return;
            }
            switch(action) {
                case "rulesTax":
                    setItem(item);
                    modalRulesTaxInstance.current.show();
                    break;
                case "removeItem":
                    setInvoice(prev => ({
                        ...prev,
                        lineInvoices: prev.lineInvoices.filter((i: LineInvoiceInterface) => i?.id != id)
                    }));
                    break;
                default:
                    console.warn("Acción no encontrada", action);
                    break;
            }
        };

        if(invoice.lineInvoices) {
            const dataTableRef = dataTable?.current;
            if(dataTableRef) {
                dataTableRef.clear();
                dataTableRef.rows.add(invoice?.lineInvoices?.slice()?.reverse() || []);
                dataTableRef.draw();
            }
        }
        tableDT.on("change", handler);
        tableDT.on("click", ".action-btn", handlerBtn);
        return () => {
            tableDT.off("change", handler);
            tableDT.off("click", ".action-btn", handlerBtn);
        };
    }, [invoice.lineInvoices]);

    useEffect(() => {
        const thirdPartyData = thirdParties.find(t => t.id == invoice.thirdParty.id);
        setProducts([]);
        setThirdParty(thirdPartyData || {});
        if(thirdPartyData) {
            if(thirdPartyData.typeRegimen.code === 'RESPONSABLE_IVA') {
                const rulerTypeTax = 'TAX';
                const rulerTax = rulesTax.find(r => r.typeRulerTax === rulerTypeTax);
                if(!rulerTax) {
                    setMessage({ message: `
                        No existe una regla tributaria para calcular el impuesto.
                        <br>
                        <small><b>Nota:</b> El tercero es responsable del IVA, por lo tanto, es necesario agregar una regla de impuesto para calcular el impuesto.</small>
                    `, type: 'warning', show: true, time: 0, html: true });
                }
            }
            if(company.currencyType.isoCode !== thirdPartyData?.currencyType?.isoCode) {
                const newExchangeRates = exchangeRates.filter(e =>
                    e.currencyExchange.isoCode === thirdPartyData?.currencyType?.isoCode
                    && e.currencyExchanged.isoCode === company.currencyType.isoCode
                );
                setExchangeRates(newExchangeRates || []);
                if(!newExchangeRates.length) {
                    setMessage({ message: `
                        No existe un tipo de cambio para la moneda del tercero.<br/>
                        <small><b>Cambio necesario:</b> ${thirdPartyData?.currencyType?.isoCode} a ${company.currencyType.isoCode}</small>
                        <br/>
                        <small><b>Nota:</b> El tercero tiene una moneda diferente a la moneda de la empresa, por lo tanto, es necesario agregar un tipo de cambio para calcular el impuesto.</small>
                    `, type: 'warning', show: true, time: 0, html: true });
                }
            }

            const loadProducts = async () => {
                try{
                    const productsResponse = await fetchHelper.post(base_url(['api/v1/products/page']), {
                        length: -1,
                        columns: [
                            { data: "thirdParty.id", searchable: true, search:{value: thirdPartyData.id, regex: false} }
                            // { data: "status", searchable: true, search:{value: "ACTIVE", regex: false} },
                            // { data: "accountingAccount.pucAccount.code", searchable: true, search:{value: "1%", regex: false} }
                        ]
                    }, {}, 0, false);
                    setProducts(productsResponse.data || []);
                    console.log(productsResponse.data, "productsResponse.data");
                }catch(error){
                    console.log(error);
                    setMessage({ message: error.msg || error.message || 'Error al cargar los productos', type: 'danger', show: true, time: 0, html: false });
                }
            }
            loadProducts();
        }
    }, [thirdParties, invoice.thirdParty.id]);

    useEffect(() => {
        if(invoice.exchangeRate?.id) {
            const exchangeRateData = exchangeRates.find(e => e.id == invoice.exchangeRate?.id);
            setExchangeRate(exchangeRateData || {});
        }
    }, [exchangeRates, invoice.exchangeRate?.id]);

    useEffect(() => {
        loadResources();
        if (!modalRulesTaxInstance.current) {
            modalRulesTaxInstance.current = new (window as any).bootstrap.Modal(
                modalRulesTaxRef.current
            );
        }
    }, []);

    useEffect(() => {
        if(thirdParty?.id) {
            if(company.currencyType.isoCode !== thirdParty?.currencyType?.isoCode) {
                setCurrencyExchangeRequired(true);
                setReload(prev => prev + 1);
                if(!requireds.some(required => required.id === 'exchangeRateId')) {
                    setRequireds(prev => [...prev, {
                        id: "exchangeRateId",
                        required: true,
                        message: "El tipo de cambio es requerido"
                    }]);
                }
            }else{
                setCurrencyExchangeRequired(false);
                if(requireds.some(required => required.id === 'exchangeRateId')) {
                    setRequireds(prev => prev.filter(required => required.id !== 'exchangeRateId'));
                }
            }
        }else{
            setCurrencyExchangeRequired(false);
            if(requireds.some(required => required.id === 'exchangeRateId')) {
                setRequireds(prev => prev.filter(required => required.id !== 'exchangeRateId'));
            }
        }
        setReload(prev => prev + 1);
    }, [thirdParty?.id, exchangeRate?.id]);

    const columns = useMemo(() => [
        {data: 'name', title: 'Nombre'},
        {data: 'description', title: 'Descripción'},
        {data: 'code', title: 'Código', render: (data, type, full, meta) => {
            const productId = full.productId || null;
            if(productId === null) {
                return `
                    <input
                        id="code-${full.id}"
                        type="text"
                        class="form-control form-control-sm change-data"
                        value="${data}"
                        data-id="${full.id}"
                        data-field="code"
                    >`;
                }
            return `${data}`;
        }},
        {data: 'price', width: '120px', title: `
            Precio ${thirdParty?.currencyType?.isoCode
                ? `(${thirdParty?.currencyType?.isoCode})` : `(${company.currencyType.isoCode})`}`, render: (data, type, full, meta) => {
            return `
                <input
                    id="price-${full.id}"
                    type="number"
                    class="form-control form-control-sm change-data"
                    value="${data}"
                    data-id="${full.id}"
                    data-field="price"
                    >
            `;
        }},
        {data: 'quantity', width: '100px', title: 'Cantidad', render: (data, type, full, meta) => {
            return `
                <input
                    id="quantity-${full.id}"
                    type="number"
                    class="form-control form-control-sm change-data"
                    value="${data}"
                    data-id="${full.id}"
                    data-field="quantity"
                    >
            `;
        }},
        {
            data: 'id',
            name: 'subTotalExchange',
            title: `Sub Total (${thirdParty?.currencyType?.isoCode || ''})`,
            render: (data, type, full) => {
                const prices = full.price * full.quantity;
        
                return formatPrice(prices, thirdParty?.currencyType?.isoCode);
            },
            visible: exchangeRate?.value !== undefined,
        },
        {data: 'id', title: `Sub Total (${company.currencyType.isoCode})`, render: (data, type, full, meta) => {
            const prices = full.price * full.quantity;
            if(exchangeRate?.value !== undefined) {
                const adjustedSubtotal = adjustCurrency({
                    price: prices,
                    fromCurrency: thirdParty?.currencyType?.isoCode,
                    toCurrency: company.currencyType.isoCode,
                    exchangeRate: exchangeRate.value
                });
                return formatPrice(adjustedSubtotal, company.currencyType.isoCode);
            }
            return formatPrice(prices, company.currencyType.isoCode);
        }},
        {data: 'id', width: '150px', title: 'Acciones', render: (data, type, full, meta) => {
            return `
                <a class="btn btn-label-success btn-sm mx-1 me-2 action-btn" href="javascript:void(0)" data-id="${full.id}" data-action="rulesTax">
                    <i class="ri-currency-line"></i>
                </a>
                <a class="btn btn-label-danger btn-sm mx-1 me-2" href="javascript:void(0)" data-id="${full.id}" data-action="removeItem">
                    <i class="ri-close-circle-line"></i>
                </a>
            `;
        }},
    ], [thirdParty, company, exchangeRate]);

    const handleSave = async () => {
        setMessage({ message: '', type: '', show: false, time: 0, html: false });
        setErrors({
            lineInvoices: '',
            thirdParty: '',
            invoiceDate: '',
            exchangeRateId: ''
        });
        let isValid = true;
        if(!invoice.header.dueDate) {
            setErrors(prev => ({ ...prev, invoiceDate: 'La fecha de la orden de compra es requerida' }));
            isValid = false;
        }
        if(!invoice.thirdParty.id) {
            setErrors(prev => ({ ...prev, thirdParty: 'El proveedor es requerido' }));
            isValid = false;
        }
        if(!invoice.lineInvoices?.length) {
            setErrors(prev => ({ ...prev, lineInvoices: 'Necesita agregar al menos un item' }));
            isValid = false;
        }
        if(!invoice.exchangeRate?.id && company.currencyType.isoCode !== thirdParty?.currencyType?.isoCode){
            setErrors(prev => ({ ...prev, exchangeRate: 'El tipo de cambio es requerido' }));
            isValid = false;
        }

        if(!isValid) return;
        setMessageItem({ message: '', type: '', show: false, time: 0, html: false });
        if(thirdParty?.typeRegimen?.code === 'RESPONSABLE_IVA') {
            if(!invoice.lineInvoices?.some(item => item.taxRulesIds?.length)) {
                setMessageItem({ message: 'Necesita agregar una regla de impuesto para cada item', type: 'warning', show: true, time: 0, html: false });
                isValid = false;
            }
            if(!invoice.lineInvoices?.some(item => item.code !== null && item.code !== undefined && item.code !== '')) {
                setMessageItem({ message: 'Necesita agregar un código para cada item', type: 'warning', show: true, time: 0, html: false });
                isValid = false;
            }
        }
        if(!isValid) return;
        setIsSending(true);
        try{
            let invoiceSend = invoice;
            invoiceSend.lineInvoices = invoiceSend.lineInvoices.map(item => ({
                ...item,
                id: Number(item.id) ? Number(item.id) : null
            }));
            const response = await fetchHelper.post(base_url(['api/v1/invoices/oc/create']), invoiceSend, {}, 500, false);
            (window as any).Swal.fire?.({
                title: 'Orden de compra creada',
                text: response.message || 'La orden de compra ha sido creada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                customClass: {
                    confirmButton: 'btn btn-primary waves-effect'
                },
                allowOutsideClick: false,
                showConfirmButton: true,
                showCancelButton: false,
                showCloseButton: false,
            }).then((result: any) => {
                if(result.isConfirmed) {
                    navigate(-1);
                }
            });
        }catch(error){
            setMessage({ message: error.msg || 'Error al guardar la orden de compra', type: 'danger', show: true, time: 0, html: false });
        }finally{
            setIsSending(false);
        }
    }

    const handleSaveRulesTax = async () => {
        setInvoice(prev => (
            {
                ...prev,
                lineInvoices: (prev.lineInvoices || []).map(a =>
                    a.asset.id == item?.asset.id ? item : a
                )
            }
        ));
        if(modalRulesTaxInstance.current) {
            modalRulesTaxInstance.current.hide();
        }
    }

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h4 className={`text-center border-bottom border-2 border-secondary pb-2`}>
                        Crear Orden de Compra
                    </h4>

                    <div className="row d-flex justify-content-between align-items-center">
                        <div className="col-12 col-md-10">
                            
                            <h5 className="card-title mb-1">Orden de Compra</h5>
                            <p className="card-subtitle mb-0">{generateInvoiceCode('OC', "X")}</p>
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
                        html={true}
                        show={message.show}
                        duration={message.time}
                        onChange={() => setMessage({ message: '', type: '', show: false, time: 3000, html: false })}
                    />
                </div>
                <div className="card-body">
                    <div className="row">

                        <div className={`col-12 mb-2 ${currencyExchangeRequired ? 'col-md-3' : 'col-md-4'}`}>
                            <InputSelectModal
                                id="thirdPartyId"
                                label="Proveedor"
                                placeholder="Selecciona un proveedor"
                                labelOption="thirdPartyId"
                                options={thirdParties.map(t => ({label: `${t.businessName} - ${t.thirdPartyCode}`, id: t.id}))}
                                value={invoice.thirdParty.id}
                                onChange={(value: string) => {
                                    setInvoice({ ...invoice, thirdParty: { ...invoice.thirdParty, id: value } })
                                    setErrors({ ...errors, thirdParty: '' });
                                }}
                                required={requireds.some(required => required.id === 'thirdPartyId' && required.required)}
                                error={errors.thirdParty}
                            />
                        </div>

                        <div className={`col-12 mb-2 ${currencyExchangeRequired ? 'col-md-3' : 'col-md-4'}`}>
                            <InputSelectModal
                                id="productId"
                                label="Producto"
                                placeholder="Selecciona un producto"
                                labelOption="productId"
                                options={products.map(p => ({label: `${p.name}`, id: p.id}))}
                                value={invoice.productId}
                                onChange={(value: string) => {
                                    // const productData = products.find(p => p.id == value);
                                    console.log(value, "value");
                                    setInvoice(prev => ({ ...prev, productId: value }));
                                    setErrors({ ...errors, lineInvoices: '' });
                                }}
                                newOption={true}
                                required={requireds.some(required => required.id === 'lineInvoices' && required.required)}
                                error={errors.lineInvoices}
                                disabled={!thirdParty?.id ||
                                    (
                                        company.currencyType.isoCode !== thirdParty?.currencyType?.isoCode
                                        && !invoice.exchangeRate?.id
                                    )
                                    || (
                                        rulesTax?.length === 0
                                        && thirdParty?.typeRegimen?.code === 'RESPONSABLE_IVA'
                                    )
                                }
                            />
                        </div>
                        <div className={`col-12 mb-2 ${currencyExchangeRequired ? 'col-md-3' : 'col-md-4'}`}>
                            <InputDate
                                id="invoiceDate"
                                label="Fecha prevista de entrega"
                                placeholder="Selecciona una fecha de entrega"
                                date={invoice.header.dueDate}
                                dateFormat="Y-m-d"
                                disabled={false}
                                onChange={(value: string) => {
                                    setInvoice({ ...invoice, header: { ...invoice.header, dueDate: value } });
                                    setErrors({ ...errors, invoiceDate: '' });
                                }}
                                minDate={new Date().toISOString().split('T')[0]}
                                required={requireds.some(required => required.id === 'invoiceDate' && required.required)}
                                error={errors.invoiceDate}
                            />
                        </div>
                        {
                            currencyExchangeRequired && (
                                <div className="col-12 col-md-3 mb-2">
                                    <InputSelectModal
                                        id="exchangeRateId"
                                        label="Tipo de cambio"
                                        placeholder="Selecciona un tipo de cambio"
                                        labelOption="exchangeRateId"
                                        options={exchangeRates
                                            .map(e => ({
                                                label: `${e.currencyExchange.isoCode} a ${e.currencyExchanged.isoCode} - ${formatPrice(e.value, e.currencyExchanged.isoCode)}`,
                                                id: e.id}))}
                                        value={invoice.exchangeRate?.id}
                                        onChange={(value) => {
                                            setInvoice({ ...invoice, exchangeRate: { ...invoice.exchangeRate, id: value } });
                                            setErrors({ ...errors, exchangeRateId: undefined });
                                        }}
                                        required={true}
                                        error={errors.exchangeRateId}
                                    />
                            </div>
                            )
                        }


                    </div>
                    
                    <div className="row">
                        <div className="col-12 mb-2">
                            <TextareaModal
                                id="notes"
                                label="Notas"
                                placeholder="Notas de la orden de compra"
                                value={invoice.notes}
                                onChange={(value: string) => {
                                    setInvoice({ ...invoice, notes: value });
                                }}
                                error={false}
                                required={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <AlertPage
                        type={messageItem.type}
                        message={messageItem.message}
                        html={true}
                        show={messageItem.show}
                        duration={messageItem.time}
                        onChange={() => setMessageItem({ message: '', type: '', show: false, time: 3000, html: false })}
                    />
                    <div className="card-datatable invoice-table">
                        <DataTableReference
                            tableRef={table}
                            dataTableRef={dataTable}
                            columns={columns}
                            data={invoice.lineInvoices}
                            buttons={[]}
                            reload={reload}
                        />
                    </div>
                </div>
                {/* <div className="card-footer">
                    <div className="row align-items-end justify-content-center">
                        <div className="col-12 col-md-6">
                            <table className="table table-sm">
                                {
                                    exchangeRate?.value !== undefined && (
                                        <thead>
                                            <tr>
                                                <th>-</th>
                                                <th>{thirdParty?.currencyType?.isoCode}</th>
                                                <th>{company.currencyType.isoCode}</th>
                                            </tr>
                                        </thead>
                                    )
                                }
                                <tbody>
                                    <tr>
                                        <td className="p-0"><b>Base</b></td>
                                        {
                                            exchangeRate?.value !== undefined && (
                                                <td className="p-0">{formatPrice(invoice?.lineInvoices?.reduce((acc, item) => {
                                                    const prices = item.price * item.quantity;
                                                    return acc + prices;
                                                }, 0), thirdParty?.currencyType?.isoCode)}</td>
                                            )
                                        }
                                        <td className="p-0">{formatPrice(invoice?.lineInvoices?.reduce((acc, item) => {
                                            const prices = item.price * item.quantity;
                                            if(exchangeRate?.value !== undefined) {
                                                const adjustedPrice = adjustCurrency({
                                                    price: prices,
                                                    fromCurrency: thirdParty?.currencyType?.isoCode,
                                                    toCurrency: company.currencyType.isoCode,
                                                    exchangeRate: exchangeRate.value
                                                });
                                                return acc + adjustedPrice;
                                            }
                                            return acc + prices;
                                        }, 0), company.currencyType.isoCode)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-0"><b>Descuentos</b></td>
                                        {
                                            exchangeRate?.value !== undefined && (
                                                <td className="p-0">{formatPrice(invoice?.lineInvoices?.reduce((acc, item) => {
                                                    const prices = item.price * item.quantity;
                                                    const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                                    item.discount?.value ? item.discount.value : 0;
                                                    return acc + discount;
                                                }, 0), thirdParty?.currencyType?.isoCode)}</td>
                                            )
                                        }
                                        <td className="p-0">{formatPrice(invoice?.lineInvoices?.reduce((acc, item) => {
                                            const prices = item.price * item.quantity;
                                            const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                            item.discount?.value ? item.discount.value : 0;
                                            if(exchangeRate?.value !== undefined) {
                                                const adjustedDiscount = adjustCurrency({
                                                    price: discount,
                                                    fromCurrency: thirdParty?.currencyType?.isoCode,
                                                    toCurrency: company.currencyType.isoCode,
                                                    exchangeRate: exchangeRate.value
                                                });
                                                return acc + adjustedDiscount;
                                            }
                                            return acc + discount;
                                        }, 0), company.currencyType.isoCode)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-0"><b>Impuestos</b></td>
                                        {
                                            exchangeRate?.value !== undefined && (
                                                <td className="p-0">{formatPrice(invoice?.lineInvoices?.reduce((acc, item) => {
                                                    const prices = item.price * item.quantity;
                                                    const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                                    item.discount?.value ? item.discount.value : 0;
                                                    const taxes = item.taxRulesIds?.reduce((acc, r) => {
                                                        const value = ((r.percentage * (prices - discount)) / 100);
                                                        return acc + value;
                                                    }, 0);
                                                    return acc + taxes;
                                                }, 0), thirdParty?.currencyType?.isoCode)}</td>
                                            )
                                        }
                                        <td className="p-0">{formatPrice(invoice?.lineInvoices?.reduce((acc, item) => {
                                            const prices = item.price * item.quantity;
                                            const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                            item.discount?.value ? item.discount.value : 0;
                                            const taxes = item.taxRulesIds?.reduce((acc, r) => {
                                                const value = ((r.percentage * (prices - discount)) / 100);
                                                if(exchangeRate?.value !== undefined) {
                                                    const adjustedValue = adjustCurrency({
                                                        price: value,
                                                        fromCurrency: thirdParty?.currencyType?.isoCode,
                                                        toCurrency: company.currencyType.isoCode,
                                                        exchangeRate: exchangeRate.value
                                                    });
                                                    return acc + adjustedValue;
                                                }
                                                return acc + value;
                                            }, 0);
                                            return acc + taxes;
                                        }, 0), company.currencyType.isoCode)}</td>
                                    </tr>
                                    <tr className="border-top">
                                        <td className="p-0"><b>Total</b></td>
                                        {
                                            (() => {
                                                if(invoice?.lineInvoices?.length > 0) {
                                                    const subtotal = invoice.lineInvoices.reduce((acc, item) => {
                                                        const prices = item.price * item.quantity;
                                                        const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                                        item.discount?.value ? item.discount.value : 0;
                                                        const taxes = item.taxRulesIds?.reduce((acc, r) => {
                                                            const value = ((r.percentage * (prices - discount)) / 100);
                                                            return acc + value;
                                                        }, 0);
                                                        return acc + (prices - discount + taxes);
                                                    }, 0);
                                                    return <td className="p-0">{formatPrice(subtotal, thirdParty?.currencyType?.isoCode)}</td>
                                                }
                                                return <td className="p-0">{formatPrice(0, thirdParty?.currencyType?.isoCode)}</td>
                                            })()
                                        }
                                        {
                                            (() => {
                                                if(invoice?.lineInvoices?.length > 0) {
                                                    const subtotal = invoice.lineInvoices.reduce((acc, item) => {
                                                        const prices = item.price * item.quantity;
                                                        const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                                        item.discount?.value ? item.discount.value : 0;
                                                        const taxes = item.taxRulesIds?.reduce((acc, r) => {
                                                            const value = ((r.percentage * (prices - discount)) / 100);
                                                            return acc + value;
                                                        }, 0);
                                                        return acc + (prices - discount + taxes);
                                                    }, 0);
                                                    if(exchangeRate?.value !== undefined) {
                                                        const adjustedSubtotal = adjustCurrency({
                                                            price: subtotal,
                                                            fromCurrency: thirdParty?.currencyType?.isoCode,
                                                            toCurrency: company.currencyType.isoCode,
                                                            exchangeRate: exchangeRate.value
                                                        });
                                                        return <td className="p-0">{formatPrice(adjustedSubtotal, company.currencyType.isoCode)}</td>
                                                    }
                                                    return <td className="p-0">{formatPrice(
                                                        subtotal,
                                                        company.currencyType.isoCode
                                                    )}</td>
                                                }
                                                return <td className="p-0">{formatPrice(0, company.currencyType.isoCode)}</td>
                                            })()
                                        }
                                    </tr>
                                </tbody>
                                
                            </table>
                        </div>
                        <div className="col-12 col-md-6">
                            <div className="d-flex justify-content-lg-end justify-content-center my-2">
                                <button className="btn btn-primary me-2" onClick={handleSave} disabled={isSending}>
                                    {isSending ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="ri-add-line"></i>} Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>

            <TotalsInvoice
                invoice={invoice} 
                company={company}
                thirdParty={thirdParty}
                exchangeRate={exchangeRates.find(e => e.id == invoice?.exchangeRate?.id)}
                send={handleSave}
                isSending={isSending}
            />

            <TaxRetentionDetail
                modalRef={modalRulesTaxRef}
                modalInstance={modalRulesTaxInstance}
                thirdParty={thirdParty}
                rules={rulesTax}
                item={item}
                setItem={setItem}
                onchange={handleSaveRulesTax}
            />

            {/* <div className="col-lg-4 col-md-6">
                <div className="mt-4">
                <div className="modal fade" ref={modalRulesTaxRef} id="modalCenter" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                        <h4 className="modal-title" id="modalCenterTitle">Reglas de impuesto</h4>
                        <button
                            type="button"
                            onClick={() => {
                                if(modalRulesTaxInstance.current) {
                                    modalRulesTaxInstance.current.hide();
                                }
                            }}
                            className="btn-close"
                            aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <table className="table table-bordered table-sm">
                                <thead>
                                    <tr>
                                        <th colSpan="3" className="text-center p-2">Impuestos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        thirdParty?.typeRegimen?.code === 'RESPONSABLE_IVA' ? (
                                            <>
                                                <tr>
                                                    <td>IVA</td>
                                                    <td>
                                                        <div className="row">
                                                            <div className="col-12">
                                                                <InputSelectModal
                                                                    id="rulerTaxId"
                                                                    label="Regla de impuesto"
                                                                    name="rulerTaxId"
                                                                    options={rulesTax.map(r => ({label: `${r.name} - ${r.percentage}%`, id: r.id}))}
                                                                    value={item?.taxRulesIds[0]?.taxId || null}
                                                                    onChange={(value) => {
                                                                        const rulerTax = rulesTax.find(r => r.id == value);
                                                                        setItem({ ...item, taxRulesIds: [
                                                                            {taxId: value, percentage: rulerTax?.percentage || 0, value: rulerTax?.value || 0 }
                                                                        ] });
                                                                    }}
                                                                    required={true}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {formatPrice(item?.taxRulesIds?.reduce((acc, r) => {
                                                            const prices = item.price * item.quantity;
                                                            const discount = item.discount?.percentage ? (prices * item.discount.percentage) / 100 : 
                                                            item.discount?.value ? item.discount.value : 0;
                                                            const value = ((r.percentage * (prices - discount)) / 100);
                                                            return acc + value;
                                                        }, 0))}
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td>IVA</td>
                                                <td>0%</td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </table>
                            {
                                rulesTax.some(r => r.typeRulerTax === 'WHITHOLDING') && (
                                    <table className="table table-bordered table-sm">
                                        <thead>
                                            <tr>
                                                <th colSpan="3" className="text-center p-2">Retenciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Retenciones</td>
                                                <td>Retenciones</td>
                                                <td>Retenciones</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )
                            }
                            <table className="table table-bordered table-sm">
                                <thead>
                                    <tr>
                                        <th colSpan="2" className="text-center p-2">
                                            Descuentos
                                            <br />
                                            <small className="text-muted">
                                                El descuento se aplica al subtotal de la orden de compra
                                            </small>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <InputModal
                                                id="discountPercentage"
                                                label="Porcentaje de descuento"
                                                type="number"
                                                name="discountPercentage"
                                                value={item?.discount?.percentage || 0}
                                                onChange={(e) => {
                                                    const percentage = Number(e.target.value);
                                                    if(percentage < 0 || percentage > 100) {
                                                        return;
                                                    }
                                                    setItem({ ...item, discount: { percentage: percentage, value: 0 } });
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <InputModal
                                                id="discountValue"
                                                label="Valor de descuento"
                                                type="number"
                                                name="discountValue"
                                                value={item?.discount?.value || 0}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    if(value < 0) {
                                                        return;
                                                    }
                                                    setItem({ ...item, discount: { percentage: 0, value: value } });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => {
                                if(modalRulesTaxInstance.current) {
                                    modalRulesTaxInstance.current.hide();
                                }
                            }}>
                                Cerrar
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveRulesTax}>Guardar</button>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div> */}
        </>
    );
};

export default CreateOC;