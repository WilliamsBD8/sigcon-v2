import { fetchHelper } from "@/utils/fetch";
import { base_url, formatDate, formatPrice, generateInvoiceCode } from "@/utils/functions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HeaderInterface, InvoiceInterface } from "../interfaces/invoice.interface";
import AlertPage from "@/components/molecules/AlertPage";
import DataTableReference from "@/components/organism/DataTable";

const IndexFV = () => {
    const user = useSelector((state: any) => state.user.user);
    const userPermissions = user?.permissions?.filter((p: { code: string }) => p.code.includes('INVOICE_FV')) || [];
    const isAdmin = user?.isAdmin || false;
    const navigate = useNavigate();

    const [message, setMessage] = useState({ message: '', type: '', show: false, time: 3000 });
    const tableRef = useRef(null);
    const dataTableRef = useRef(null);
    const [data, setData] = useState<InvoiceInterface[] | []>([]);
    const urlApi = useMemo(() => ["api/v1/invoices/fv/page"], []);

    const buttons = useMemo(() => [
        ...(userPermissions.some((p) => p.code === 'CREATE_INVOICE_FV') || isAdmin ? [{
            text: `<i class="ri-add-line ri-16px me-sm-2"></i> <span class="d-none d-sm-inline-block">Crear Factura de Venta</span>`,
            className: "btn rounded-pill btn-primary waves-effect mx-1 my-2",
            action: function () {
                navigate("create");
            },
        }] : []),
    ], [userPermissions, isAdmin, navigate]);

    const actions = useMemo(() => [
        ...(userPermissions.some((p) => p.code === 'VIEW_INVOICE_FV') || isAdmin ? [{
            key: "view",
            icon: "ri-eye-line",
            class: "primary",
            title: "Ver factura",
        }] : []),
        ...(userPermissions.some((p) => p.code === 'UPDATE_INVOICE_FV') || isAdmin ? [{
            key: "edit",
            icon: "ri-pencil-line",
            class: "info",
            title: "Editar factura",
        }] : []),
        // ...(userPermissions.includes('VIEW_INVOICE_FV_PAYMENTS') || isAdmin ? [{
        //     key: "payments",
        //     icon: "ri-hand-coin-line",
        //     class: "warning",
        //     title: "Ver pagos"
        // }] : []),
    ], [userPermissions, isAdmin]);

    const columns = useMemo(() => [
        {
            title: "Documento",
            data: "header",
            render: (_: unknown, __: unknown, i: InvoiceInterface) =>
                generateInvoiceCode(i.header.type.code, i.header.serial),
        },
        {
            title: "Fecha de<br>venta",
            width: '110px',
            data: "header.dueDate",
            render: (date: string) => (date ? formatDate(date, 'YYYY-MM-DD') : '—'),
        },
        {
            title: "Estado",
            width: '100px',
            data: "state",
            render: (state: { name?: string; color?: string } | null) =>
                state
                    ? `<span class="badge bg-label-${state.color || 'info'}">${state.name}</span>`
                    : '—',
        },
        {
            title: "Total",
            data: "values.totalPayment",
            render: (value: number) => formatPrice(value),
        },
        { title: "Cliente", data: "thirdParty.businessName" },
        {
            title: "Acciones",
            width: '100px',
            data: "header.id",
            render: (id: number) => `
                <div class="d-flex justify-content-center gap-1">
                    ${actions.map((a) => `
                        <a class="btn btn-sm btn-text-${a.class} rounded-pill btn-icon action-btn tool"
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
            `,
        },
    ], [actions]);

    useEffect(() => {
        const table = dataTableRef?.current;
        if (!table) return;
        const handler = function () {
            const action = $(this).data("action");
            const id = Number($(this).data("id"));
            switch (action) {
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
                    break;
            }
        };
        table.on('click', '.action-btn', handler);
        return () => table.off('click', '.action-btn', handler);
    }, [data, navigate]);

    return (
        <div className="col-lg-12 mt-0">
            <div className="card h-100">
                {message.show && (
                    <div className="card-body">
                        <AlertPage
                            type={message.type}
                            message={message.message}
                            show={message.show}
                            onChange={() => setMessage({ message: '', type: '', show: false, time: 0 })}
                            duration={message.time}
                        />
                    </div>
                )}
                <div className="card-datatable text-nowrap">
                    <DataTableReference
                        tableRef={tableRef}
                        dataTableRef={dataTableRef}
                        url_api={urlApi}
                        method="POST"
                        buttons={buttons}
                        title="Facturas de Venta"
                        setData={setData}
                        filtered={false}
                        columns={columns}
                        filterColumns={[]}
                    />
                </div>
            </div>
        </div>
    );
};

export default IndexFV;
