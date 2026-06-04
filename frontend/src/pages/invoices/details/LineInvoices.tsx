import AlertPage from "@/components/molecules/AlertPage";
import { ExchangeRateInterface, InvoiceInterface, LineInvoiceInterface, ThirdPartyInterface, TypeInterface } from "../interfaces/invoice.interface";
import { useEffect, useMemo, useRef, useState } from "react";
import DataTableReference from "@/components/organism/DataTable";
import { useSelector } from "react-redux";
import { adjustCurrency, formatPrice } from "@/utils/functions";

interface Props {
    thirdParty: ThirdPartyInterface;
    type: TypeInterface;
    exchangeRate: ExchangeRateInterface;
    invoice: InvoiceInterface;
    setInvoice: Function;
    fieldsEditable: {
        [key: string]: boolean;
    } | null;
    view?: boolean;
}

const LineInvoices = ({
    thirdParty,
    type,
    invoice,
    exchangeRate,
    setInvoice,
    fieldsEditable = null,
    view = false
}: Props) => {

    const company = useSelector((state: any) => state.user).user.company;
    
    const table = useRef<any>(null);
    const dataTable = useRef<any>(null);

    const [messageItem, setMessageItem] = useState<any>({
        message: "",
        type: "",
        show: false,
        time: 3000,
        html: false
    });
    const [reload, setReload] = useState<number>(0);
    
    const columns = useMemo(() => {
        let columns: any[] = [
            {data: 'name', title: 'Nombre'},
            {data: 'description', title: 'Descripción'},
            {data: 'code', title: 'Código', render: (data: string, type: string, full: any, meta: any) => {
                const product = full.product || null;
                if(product === null) {
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
            }}
        ];
        const priceColumnTitle = type.code === 'FV'
            ? `Precio de venta (${company.currencyType.isoCode})`
            : `Precio ${thirdParty?.isoCode ? `(${thirdParty?.isoCode})` : `(${company.currencyType.isoCode})`}`;

        switch(type.code) {
            case "OC":
            case "FC":
            case "FV":
                columns.push(...[
                    ...(type.code === 'FV' || type.code === 'FC' ? [{
                        data: 'product.stock',
                        width: '90px',
                        title: 'Stock',
                        render: (_: unknown, __: unknown, full: LineInvoiceInterface) => {
                            const stock = full.product?.stock;
                            return stock != null ? Number(stock) : '—';
                        },
                    }] : []),
                    {data: 'price', width: '120px', title: priceColumnTitle, render: (data, type, full, meta) => {
                        return !fieldsEditable?.price ? `
                            <input
                                id="price-${full.id}"
                                type="number"
                                class="form-control form-control-sm change-data"
                                value="${data}"
                                data-id="${full.id}"
                                data-field="price"
                                >
                        ` : formatPrice(data, company.currencyType.isoCode);
                    }},
                    {data: 'quantity', width: '120px', title: `
                        Cantidad`, render: (data, type, full, meta) => {
                        return !view ? `
                            <input
                                id="quantity-${full.id}"
                                type="number"
                                class="form-control form-control-sm change-data"
                                value="${data}"
                                data-id="${full.id}"
                                data-field="quantity"
                                >
                        ` : `${data}`;
                    }},                    
                    {data: 'id', title: `Sub Total (${company.currencyType.isoCode})`, render: (data, type, full, meta) => {
                        let price = full.price * full.quantity;
                        if(exchangeRate !== null) {
                            price = adjustCurrency({
                                price: price,
                                fromCurrency: thirdParty?.isoCode,
                                toCurrency: company.currencyType.isoCode,
                                exchangeRate: exchangeRate?.value
                            });
                        }
                        return formatPrice(price, company.currencyType.isoCode);
                    }},
                ]);
                break;
            default:
                break;
        }

        if(!fieldsEditable?.actions) {
            columns.push({data: 'id', width: '150px', title: 'Acciones', render: (data, type, full, meta) => {
                return `
                    <a class="btn btn-label-success btn-sm mx-1 me-2 action-btn" href="javascript:void(0)" data-id="${full.id}" data-action="rulesTax">
                        <i class="ri-currency-line"></i>
                    </a>
                    <a class="btn btn-label-danger btn-sm mx-1 me-2 action-btn" href="javascript:void(0)" data-id="${full.id}" data-action="removeItem">
                        <i class="ri-close-circle-line"></i>
                    </a>
                `;
            }});
        }

        return columns;
    }, []);

    const loadDataTable = () => {
        const dataTableRef = dataTable?.current;
        if(dataTableRef) {
            dataTableRef.clear();
            dataTableRef.rows.add(invoice?.lineInvoices?.slice()?.reverse().filter((i: LineInvoiceInterface) => !i.isDeleted) || []);
            dataTableRef.draw();
            setReload(reload + 1);
        }
    }

    useEffect(() => {
        const tableDT = dataTable?.current;
        if(!tableDT) return;
    
        const handler = (e) => {
            if (e.target.matches(".change-data")) {
    
                const el = e.target;
                const { id, field } = el.dataset;
                let value = el.value;

                const lineInvoice = invoice?.lineInvoices?.find((i: LineInvoiceInterface) => i.id == id);
                if(!lineInvoice) {
                    console.warn("Item no encontrado", id);
                    return;
                }

                switch (field) {
                    case 'price':
                        lineInvoice.price = Number(value);
                        break;
                    case 'quantity': {
                        const qty = Number(value);
                        const stockAvail = lineInvoice?.product?.stock;
                        const capStock = (type?.code === 'FV' || type?.code === 'OC')
                            && stockAvail != null
                            && stockAvail > 0;
                        lineInvoice.quantity = capStock && qty > stockAvail ? stockAvail : qty;
                        break;
                    }
                }

                setInvoice((prev: InvoiceInterface) => ({
                    ...prev,
                    lineInvoices: prev.lineInvoices.map((item: LineInvoiceInterface) =>
                        item.id == id
                            ? { ...lineInvoice }
                            : item
                    )
                }));
            }
        };

        const handlerBtn = function(){
            console.log("handlerBtn");
            const action = $(this).data("action");
            const id = $(this).data("id");
            const item = invoice?.lineInvoices?.find((i: LineInvoiceInterface) => i.id == id);
            if(!item) {
                console.warn("Item no encontrado", id);
                return;
            }
            switch(action) {
                case "rulesTax":
                    // setItem(item);
                    // modalRulesTaxInstance.current.show();
                    break;
                case "removeItem":
                    console.log(id, "id removeItem");

                    const lineInvoices = invoice?.lineInvoices.map((i: LineInvoiceInterface) =>
                        i.id == id
                            ? { ...i, isDeleted: true }
                            : i
                    ).filter((i: LineInvoiceInterface) => !i.isDeleted && Number(i.id));
                    setInvoice({
                        ...invoice,
                        lineInvoices: lineInvoices
                    });
                    break;
                default:
                    console.warn("Acción no encontrada", action);
                    break;
            }
        };

        if(invoice?.lineInvoices) {
            loadDataTable();
        }
        tableDT.on("change", handler);
        tableDT.on("click", ".action-btn", handlerBtn);
        return () => {
            tableDT.off("change", handler);
            tableDT.off("click", ".action-btn", handlerBtn);
        };
    }, [invoice?.lineInvoices]);

    useEffect(() => {
        console.log(invoice, "invoice");
        if(invoice?.productId) {
            const product = invoice?.product;
            let lineInvoices = [...(invoice.lineInvoices || [])];
            let lineInvoice = lineInvoices.find((i: LineInvoiceInterface) => i.productId == invoice?.productId);
            if(!product && !lineInvoice){
                const item: LineInvoiceInterface = {
                    id: crypto.randomUUID(),
                    productId: invoice.productId,
                    asset: null,
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
            }else if(product && !lineInvoice){
                const unitPrice = type?.code === 'FV'
                    ? (product.salePrice ?? product.price ?? 0)
                    : (product.price ?? 0);
                const item: LineInvoiceInterface = {
                    id: crypto.randomUUID(),
                    productId: invoice.productId,
                    asset: null,
                    product: {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        code: product.code,
                        stock: product.stock ?? null,
                        price: product.price,
                        salePrice: product.salePrice ?? product.price,
                    },
                    name: product.name,
                    description: product.description,
                    price: unitPrice,
                    quantity: 1,
                    taxRulesIds: [],
                    retentions: [],
                    discount: { percentage: 0, value: 0 },
                    code: product.code,
                    isDeleted: false
                }
                lineInvoices.push(item);
            }else {
                const nextQty = lineInvoice.quantity + 1;
                const stockAvail = lineInvoice?.product?.stock;
                const capStock = (type?.code === 'FV' || type?.code === 'OC')
                    && stockAvail != null
                    && stockAvail > 0;
                lineInvoice.quantity = capStock && nextQty > stockAvail ? stockAvail : nextQty;
            }
            
            setInvoice({
                ...invoice,
                lineInvoices: lineInvoices,
                productId: null,
                product: null
            });
        }
    }, [invoice?.productId])

    useEffect(() => {
        loadDataTable();
    }, []);
    
    return (
        <>
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
                        data={invoice?.lineInvoices}
                        buttons={[]}
                        reload={reload}
                    />
                </div>
            </div>
        </>
    );
}

export default LineInvoices;