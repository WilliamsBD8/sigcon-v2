import DataTableReference from "@/components/organism/DataTable";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AlertPage from "@/components/molecules/AlertPage";
import { base_url, formatPrice, generateInvoiceCode } from "@/utils/functions";
import { fetchHelper } from "@/utils/fetch";

const IndexOC = () => {
    const user = useSelector(state => state.user.user);
    const userPermissions = user?.permissions?.filter(p => p.code.includes('INVOICE_OC')) || [];
    const isAdmin = user?.isAdmin || false;
    const company = user?.company;

    const navigate = useNavigate();

    const [message, setMessage] = useState({ message: '', type: '', show: false, time: 3000 });

    const tableRef = useRef(null);
    const dataTableRef = useRef(null);
    const [data, setData] = useState([]);
    const urlApi = useMemo(() => ["api/v1/invoices/oc/page"], []);
    const [invoices, setInvoices] = useState([]);
    const [states, setStates] = useState([]);

    const [permissions, setPermissions] = useState([1]);
    const [filterColumns, setFilterColumns] = useState([]);

    const fetchStates = async () => {
        const response = await fetchHelper.post(base_url(["api/v1/invoices/states/page"]), {
            length: -1,
            columns: [
                {data: 'block', searchable: true, search: {value: 'OC', regex: false}},
            ]
        }, {}, 500, false);
        setStates(response.data.sort((a, b) => a.id - b.id));
    };
    
    const fetchInvoices = async () => {
        const response = await fetchHelper.post(base_url(urlApi), {
            length: -1
        }, {}, 500, false);
        setInvoices(response.data);
    };
    
    const [buttons, setButtons] = useState([
        ...(userPermissions.includes('CREATE_INVOICE_OC') || isAdmin ? [{
            text: `<i class="ri-add-line ri-16px me-sm-2"></i> <span class="d-none d-sm-inline-block">Crear Orden de Compra</span>`,
            className: "btn rounded-pill btn-primary waves-effect mx-1 my-2",
            action: function () { 
                navigate("create");
            }
        }] : [])
    ]);

    const actions = useMemo(() => [
        {
            key: "view",
            icon: "ri-eye-line",
            class: "primary",
            title: "Ver OC"
        },
        ...(userPermissions.includes('UPDATE_INVOICE_OC') || isAdmin ? [{
            key: "edit",
            icon: "ri-pencil-line",
            class: "info",
            title: "Editar OC"
        }] : []),
        ...(userPermissions.includes('APPROVE_INVOICE_OC') || isAdmin ? [{
            key: "approve",
            icon: "ri-check-line",
            class: "success",
            title: "Aprobar OC"
        }] : []),
        ...(userPermissions.includes('REJECT_INVOICE_OC') || isAdmin ? [{
            key: "reject",
            icon: "ri-close-line",
            class: "danger",
            title: "Rechazar OC"
        }] : []),
        ...(userPermissions.includes('RECEIVED_INVOICE_OC') || isAdmin ? [{
            key: "received",
            icon: "ri-folder-received-line",
            class: "success",
            title: "Recibir OC"
        }] : [])
    ], [userPermissions, isAdmin]);
    
    const [columns, setColumns] = useState([
        {title: "Resolución", data: "resolution", render: (_,__,i) => generateInvoiceCode(i.header.type.code, i.header.serial)},
        {title: "Fecha prevista de entrega", width: '100px', data: "header.dueDate"},
        {title: "Estado de la orden", width: '100px', data: "state", render: (state) => `<span class="badge bg-${state.color}">${state.name}</span>`},
        {title: "Valor de la orden", data: "values.totalPayment", render: (value) => formatPrice(value)},
        {title: "Total recibido", data: "invoicesReferences", render: (value) => formatPrice(value.reduce((acc, curr) => acc + curr.values.totalPayment, 0))},
        {title: 'Acciones', data: 'header.id', width: '50px', render: (id, _, full) =>{
            const actionView = actions.find(a => a.key === "view")
            const actionsFiltered = full.state.id === 3 || full.state.id === 5 || full.state.id === 6 ? [] : actions.filter(a => a.key !== "view")
                .filter(a => 
                    full.state.id === 1 && (a.key === "approve" || a.key === "reject" || a.key === "edit")
                    || (full.state.id === 2 || full.state.id === 4) && a.key === "received"
                );

            return `
                    <div class="d-flex justify-content-center gap-1">
                        ${actionView ? `
                            <a class="btn btn-sm btn-text-${actionView.class}  rounded-pill btn-icon action-btn tool"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                data-bs-custom-class="tooltip-${actionView.class}"
                                data-bs-original-title="${actionView.title}"
                                data-action="${actionView.key}"
                                data-id="${id}">
                                <i class="${actionView.icon}"></i>
                            </a>
                        ` : ''}
                        ${
                            actionsFiltered.length === 1 ? 
                                actionsFiltered.map(a => `
                                    <a class="btn btn-sm btn-text-${a.class}  rounded-pill btn-icon action-btn tool"
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        data-bs-custom-class="tooltip-${a.class}"
                                        data-bs-original-title="${a.title}"
                                        data-action="${a.key}"
                                        data-id="${id}">
                                        <i class="${a.icon}"></i>
                                    </a>
                                `).join('') : actionsFiltered.length > 0 ? `
                                    <a href="javascript:void(0);" class="btn btn-sm btn-text-secondary rounded-pill btn-icon dropdown-toggle hide-arrow" data-bs-toggle="dropdown" aria-expanded="false"><i class="ri-more-2-line"></i></a>
                                    <ul class="dropdown-menu dropdown-menu-end m-0" style="">
                                        ${actionsFiltered.map(a => `
                                            <a class="dropdown-item action-btn" href="javascript:void(0);"
                                                data-action="${a.key}"
                                                data-id="${id}">
                                                <i class="${a.icon} ri-16px me-sm-2 text-${a.class}"></i> 
                                                ${a.title}
                                            </a>
                                        `).join('')}
                                    </ul>
                                ` : ''
                        }
                        
                    </div>
                `
            }
        }
    ]);

    useEffect(() => {
        const validPermissions = [];
        if( userPermissions.includes('READ_INVOICE_OC')     || userPermissions.includes('APPROVE_INVOICE_OC') || 
            userPermissions.includes('REJECT_INVOICE_OC')   || userPermissions.includes('EDIT_INVOICE_OC') || isAdmin
        ) validPermissions.push(...["1", "2", "3"]);
        if( userPermissions.includes('SEND_INVOICE_OC')     || isAdmin ) validPermissions.push("2");
        if( userPermissions.includes('RECEIVED_INVOICE_OC') || isAdmin ) validPermissions.push("4");
        
        setPermissions(validPermissions
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort((a, b) => a - b)
        );

        fetchStates();
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [states]);

    useEffect(() => {
        if(permissions.length > 0) {
            setFilterColumns([
                {data: "invoiceState.id", searchable: true, search: {value: permissions.join(','), regex: false}},
            ]);
        } else {
            setFilterColumns([]);
        }
    }, [permissions]);

    useEffect(() => {
        const table = dataTableRef?.current;
        if (!table) return;
        const handler = async function () {
            const action = $(this).data("action");
            const id = Number($(this).data("id"));
            const invoiceData = data.find(i => i.header.id === id);
            if (!invoiceData) {
                console.warn("Orden de Compra no encontrada", id);
                return;
            }
            switch(action) {
                case "approve":
                case "reject":
                case "send":
                    const type = action === "approve" ? "Aprobar" : action === "reject" ? "Rechazar" : "Enviar";
                    const isReject = action === "reject";
                    const data ={
                        block: "OC",
                        code: isReject ? "REJECTED" : "APPROVED",
                        observations: null,
                    };

                    const result = await window.Swal.fire({
                        title: `${type} Orden de Compra`,
                        text: `¿Estás seguro de querer ${type.toLowerCase()} la orden de compra?`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: type,
                        cancelButtonText: "Cerrar",
                        allowOutsideClick: false,
                    
                        input: isReject ? "textarea" : undefined,
                        inputLabel: isReject ? "Observación del rechazo" : undefined,
                        inputPlaceholder: isReject
                            ? "Escribe la razón del rechazo..."
                            : undefined,
                    
                        inputValidator: (value) => {
                            if (isReject && !value?.trim()) {
                                return "La observación es obligatoria";
                            }
                            return null;
                        },
                    
                        customClass: {
                            confirmButton: "btn btn-primary",
                            cancelButton: "btn btn-secondary",
                        },
                    });
                    if(result.isConfirmed) {
                        const url = base_url(["api/v1/invoices/oc/state", id]);
                        data.observations = result.value || null;
                        try {
                            const response = await fetchHelper.post(url, data, {}, 500, false);
                            const message = response.message || `${type} orden de compra exitosamente`;
                            setMessage({ message: message, type: "success", show: true, time: 5000 });
                            dataTableRef.current.table().draw(false);
                            fetchInvoices();
                        } catch (error) {
                            const message = error.msg || error.message || `Error al ${type.toLowerCase()} la orden de compra`;
                            setMessage({ message: message, type: "danger", show: true, time: 0 });
                        }
                    }
                    break;
                case "view":
                    navigate(`view/${id}`);
                    break;
                case "received":
                case "edit":
                    navigate(`update/${id}`);
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
                                        <h5 className="mb-1">Ordenes de Compra</h5>
                                    </div>
                                    <hr />
                                </div>
                                <div className="row gy-4 gy-sm-1">
                                    {
                                        states.map(state => (
                                            <div className="col-sm-6 col-lg-2" key={state.id}>
                                                <div className="d-flex justify-content-between align-items-start h-100 border-end card-widget-1 pb-4 pb-sm-0">
                                                    <div>
                                                        <h5 className="mb-0 ">{
                                                            invoices.filter(invoice => invoice.state.id == state.id).length
                                                        }</h5>
                                                        <p className="mb-0" style={{ fontSize: '14px' }}>
                                                            <span className={`text-${state.color.split('-')[1] || state.color}`}>{state.name}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
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
                                    onChange={() => setMessage({ message: '', type: '', show: false })}
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
                            title="Ordenes de Compra"
                            setData={setData}
                            filtered={false}
                            columns={columns}
                            filterColumns={filterColumns}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default IndexOC;