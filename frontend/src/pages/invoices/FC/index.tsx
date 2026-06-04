import { fetchHelper } from "@/utils/fetch";
import { base_url, formatDate, formatPrice, generateInvoiceCode } from "@/utils/functions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HeaderInterface, InvoiceInterface, VoucherInterface } from "../interfaces/invoice.interface";
import AlertPage from "@/components/molecules/AlertPage";
import DataTableReference from "@/components/organism/DataTable";

const IndexFC = () => {

    const user = useSelector((state: any) => state.user.user);
    const userPermissions = user?.permissions?.filter(p => p.code.includes('INVOICE_OC')) || [];
    const isAdmin = user?.isAdmin || false;
    const company = user?.company;

    const navigate = useNavigate();

    const [message, setMessage] = useState({ message: '', type: '', show: false, time: 3000 });

    const tableRef = useRef(null);
    const dataTableRef = useRef(null);
    const [data, setData] = useState<InvoiceInterface[] | []>([]);
    const urlApi = useMemo(() => ["api/v1/invoices/fc/page"], []);
    const [invoices, setInvoices] = useState([]);
    const [states, setStates] = useState([]);

    const [permissions, setPermissions] = useState([1]);
    const [filterColumns, setFilterColumns] = useState([]);

    const fetchInvoices = async () => {
        const response = await fetchHelper.post(base_url(urlApi), {
            length: -1
        }, {}, 0, false);
        setInvoices(response.data);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const [buttons, setButtons] = useState([
        ...(userPermissions.includes('CREATE_INVOICE_FC') || isAdmin ? [{
            text: `<i class="ri-add-line ri-16px me-sm-2"></i> <span class="d-none d-sm-inline-block">Crear Factura de Compra</span>`,
            className: "btn rounded-pill btn-primary waves-effect mx-1 my-2",
            action: function () { 
                navigate("create");
            }
        }] : [])
    ]);

    const actions = useMemo(() => [
        ...(userPermissions.includes('VIEW_INVOICE_FC') || isAdmin ? [{
            key: "view",
            icon: "ri-eye-line",
            class: "primary",
            title: "Ver factura"
        }] : []),
        ...(userPermissions.includes('UPDATE_INVOICE_FC') || isAdmin ? [{
            key: "edit",
            icon: "ri-pencil-line",
            class: "info",
            title: "Editar factura"
        }] : []),
        ...(userPermissions.includes('VIEW_INVOICE_FC_PAYMENTS') || isAdmin ? [{
            key: "payments",
            icon: "ri-hand-coin-line",
            class: "warning",
            title: "Ver pagos"
        }] : []),
    ], [userPermissions, isAdmin]);

    const columns = useMemo(() => [
        {title: "Resolución", data: "header", render: (_:any,__:any,i:InvoiceInterface) => generateInvoiceCode(i.header.type.code, i.header.serial)},
        {title: "Fecha de<br>compra", width: '100px', data: "header.dueDate"},
        {title: "Fecha de<br>vencimiento", data: "header.issueDate", render: (date:string, i, full:any) => date && full.transaction.paymentFormId == 2 ? formatDate(date, 'YYYY-MM-DD') : 'No aplica'},
        {title: "Estado de<br>la factura", width: '100px', data: "header", render: (header:HeaderInterface) => 
            `<span class="badge bg-${header.status == "PAID" ? "label-success" : header.status == "PENDING" ? "label-warning" : "label-danger"}">${header.status == "PAID" ? "Pagado" : header.status == "PENDING" ? "Pendiente de pago" : "Rechazado"}</span>`
        },
        {title: "Valor de<br>la factura", data: "values.totalPayment", render: (value:number) => formatPrice(value)},
        {title: "Valor pendiente<br> de pago", data: "vouchers", render: (vouchers:VoucherInterface[], _, i:any) => formatPrice(i.values.totalPayment - vouchers.reduce((acc, voucher) => acc + voucher.amount, 0))},
        {title: "Proveedor", data: "thirdParty.businessName"},
        {title: "Acciones", width: '100px', data: "header.id", render: (id:number, _, full:InvoiceInterface) => {
            const acciones = actions.filter(action => !(action.key === "edit" && full.header.status == "PAID"));
            return `
                <div class="d-flex justify-content-center gap-1">
                    ${acciones.map(a => `
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
        }},
    ], []);

    useEffect(() => {
        const table = dataTableRef?.current;
        if (!table) return;
        const handler = async function () {
            const action = $(this).data("action");
            const id = Number($(this).data("id"));
            const invoiceData = data.find((i:any) => i?.header?.id === id);
            if (!invoiceData) {
                console.warn("Factura de Compra no encontrada", id);
                return;
            }
            switch(action) {
                case "view":
                    navigate(`view/${id}`);
                    break;
                case "edit":
                    navigate(`update/${id}`);
                    break;
                case "payments":
                    navigate(`payments/${id}`);
                    break;
                default:
                    console.warn("Acción no válida", action);
                    break;
            }
        };
        table.on('click', '.action-btn', handler);
        return () => table.off('click', '.action-btn', handler);
    }, [data]);

    return (
        <>
            <div className="col-lg-12">
                <div className="card mb-6">
                    <div className="card-body">
                        <div className="card-widget-separator-wrapper">
                            <div className="card-body card-widget-separator p-0">
                                <div className="col-lg-12 mt-0 mb-0">
                                    <div className="d-flex justify-content-between">
                                        <h5 className="mb-1">Facturas de Compra</h5>
                                    </div>
                                    <hr />
                                </div>
                                <div className="row gy-4 gy-sm-1">
                                    <div className="col-sm-6 col-lg-6">
                                        <div className="d-flex justify-content-between align-items-start h-100 border-end card-widget-1 pb-4 pb-sm-0">
                                            <div>
                                                <h5 className="mb-0 ">{
                                                    invoices.filter(invoice => invoice.header.status == "PENDING").length
                                                }</h5>
                                                <p className="mb-0" style={{ fontSize: '14px' }}>
                                                    <span className="text-warning">Pendiente de pago</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-sm-6 col-lg-6">
                                        <div className="d-flex justify-content-between align-items-start h-100 border-end card-widget-1 pb-4 pb-sm-0">
                                            <div>
                                                <h5 className="mb-0 ">{
                                                    invoices.filter(invoice => invoice.header.status == "PAID").length
                                                }</h5>
                                                <p className="mb-0" style={{ fontSize: '14px' }}>
                                                    <span className="text-success">Pagado</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            
                </div>
            </div>
            


            <div className="col-lg-12 mt-0">
                <div className="card h-100">
                    {
                        message.show && (
                            <div className="card-body">
                                <AlertPage
                                    type={message.type}
                                    message={message.message}
                                    show={message.show}
                                    onChange={() => setMessage({ message: '', type: '', show: false, time: 0 })}
                                    duration={message.time}
                                />
                            </div>
                        )
                    }
                    <div className="card-datatable text-nowrap">
                        <DataTableReference
                            tableRef={tableRef}
                            dataTableRef={dataTableRef}
                            url_api={urlApi}
                            method="POST"
                            buttons={buttons}
                            title="Facturas de Compra"
                            setData={setData}
                            filtered={false}
                            columns={columns}
                            filterColumns={filterColumns}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default IndexFC;