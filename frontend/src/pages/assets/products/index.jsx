import { useEffect, useMemo, useRef, useState } from "react";

import AlertPage from "../../../components/molecules/AlertPage";
import DataTableReference from "../../../components/organism/DataTable";
import FormProduct from "./form";
import { base_url, formatPrice } from "@/utils/functions";
import { useSelector } from "react-redux";
import { fetchHelper } from "@/utils/fetch";

const ProductsIndex = () => {

    const user = useSelector((state) => state.user).user;
    const company = user.company;

    const permissions = user?.permissions?.filter(p => {return p.code.includes('PRODUCT')})|| [];
    const isAdmin = user?.isAdmin || false;

    const accountingAccountsCodes = "14%,41%,61%,15%";

    const [message, setMessage] = useState({ message: '', type: '', show: false, time: 3000 });
    const [products, setProducts] = useState([]);
    const [product, setProduct] = useState({});
    const dataTableRef = useRef(null);
    const tableRef = useRef(null);
    const url = useMemo(() => {
        return ['api', 'v1', 'products', 'page'];
    }, []);
    const modalRef = useRef(null);
    const modalInstance = useRef(null);
    
    const openModal = () => {
        if (!modalInstance.current) {
            modalInstance.current = new window.bootstrap.Modal(modalRef.current);
        }
        setMessage({ message: '', type: '', show: false });
        modalInstance.current.show();
    }

    const closeModal = () => {
        if (modalInstance.current) {
            modalInstance.current.hide();
        }
    }

    const actions = useMemo(() => {
        return [
            ...(permissions.some(p => p.code === 'CREATE_PRODUCT' && p.type === 'CREATE') || isAdmin ? [{
                text: '<i class="ri-add-line ri-16px me-sm-2"></i> <span class="d-none d-sm-inline-block">Nuevo Producto</span>',
                className: 'btn rounded-pill btn-primary waves-effect mx-2 my-2',
                action: () => {
                    setProduct({
                        id: '',
                        name: '',
                        description: '',
                        code: '',
                        accountingAccountIds: [],
                        thirdPartyId: '',
                        price: 0,
                        salePrice: 0,
                        stock: 0,
                    });
                    openModal()
                },
            }] : []),
        ]
    }, [permissions, isAdmin]);

    const acciones = useMemo(() => {
        return [
            ...(permissions.some(p => p.code === 'UPDATE_PRODUCT' && p.type === 'UPDATE') || isAdmin ? [{
                key: 'edit',
                icon: 'ri-edit-line',
                class: 'btn-label-primary',
                title: 'Editar',
            }] : []),
            ...(permissions.some(p => p.code === 'DELETE_PRODUCT' && p.type === 'DELETE') || isAdmin ? [{
                key: 'delete',
                icon: 'ri-delete-bin-line',
                class: 'btn-label-danger',
                title: 'Eliminar',
            }] : []),
        ]
    }, [permissions, isAdmin]);

    const columns = useMemo(() => {
        return [
            {
                title: "Código",
                data: "code",
                name: "code",
            },
            {
                title: "Nombre",
                data: "name",
                name: "name",
            },
            {
                title: "Descripción",
                data: "description",
                name: "description",
            },
            {
                title: "Precio compra",
                data: "price",
                name: "price",
                render: (data) => formatPrice(data, company.currencyType.isoCode),
            },
            {
                title: "Precio venta",
                data: "salePrice",
                name: "salePrice",
                render: (data) => formatPrice(data ?? 0, company.currencyType.isoCode),
            },
            {
                title: "Stock",
                data: "stock",
                name: "stock",
            },
            {
                title: "Acciones",
                data: "id",
                width: '100px',
                searchable: false,
                orderable: false,
                render: (data, type, full, meta) => {
                    return `
                        <div class="d-flex gap-1">
                            ${acciones.map(a => `
                                <button class="btn btn-sm ${a.class} action-btn"
                                    data-action="${a.key}"
                                    data-id="${data}">
                                    <i class="${a.icon}"></i>
                                </button>
                            `).join('')}
                        </div>
                    `;
                }
            }
        ]
    }, [])

    useEffect(() => {
        const table = dataTableRef?.current;
        if (!table) return;

        const handler = function () {
            const action = $(this).data('action');
            const id = Number($(this).data('id'));
            const row = products.find(p => p.id === id);
            if (!row) {
                console.warn('Producto no encontrado', id);
                return;
            }
            switch (action) {
                case 'edit':
                    setProduct(
                        {
                            id: row.id,
                            name: row.name,
                            description: row.description,
                            code: row.code,
                            accountingAccountIds: row.accountingAccountIds,
                            thirdPartyId: row.thirdParty.id
                        }
                    );
                    openModal();
                    break;
                case 'delete':
                    window.Swal.fire({
                        title: '¿Está seguro?',
                        text: `¿Está seguro de eliminar el producto "${row.name}"?`,
                        icon: 'warning',
                        showCancelButton: true,
                        customClass: {
                            confirmButton: 'btn btn-danger',
                            cancelButton: 'btn btn-secondary',
                        },
                        confirmButtonText: 'Sí, continuar',
                        cancelButtonText: 'Cancelar',
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            try {
                                const deleteUrl = base_url(['api', 'v1', 'products', id]);
                                await fetchHelper.delete(deleteUrl, {}, {}, 500, false);
                                dataTableRef?.current?.ajax.reload();
                                setMessage({
                                    message: result.message || result.msg || 'Producto eliminado exitosamente',
                                    type: 'success',
                                    show: true,
                                });
                            } catch (error) {
                                console.error(error);
                                setMessage({
                                    message: error.message || error.msg || 'Error al eliminar el producto',
                                    type: 'danger',
                                    show: true,
                                });
                            }
                        }
                    });
                    break;
                default:
                    console.warn('Acción no válida', action);
                    break;
            }
        };
        table.on('click', '.action-btn', handler);
        return () => table.off('click', '.action-btn', handler);
    }, [products]);

    return (
        <>
            <div className="col-lg-12 mt-0 mb-0">
                <div className="d-flex justify-content-between">
                    <h5 className="mb-1">Productos</h5>
                </div>
                <hr />
            </div>

            <div className="col-lg-12 mt-0">
                <div className="card h-100">
                    <div className="card-body">
                        <AlertPage
                            type={message.type}
                            message={message.message}
                            show={message.show}
                            onChange={() => setMessage({ message: '', type: '', show: false, time: 3000 })}
                            duration={message.time}
                        />
                    </div>
                    <div className="card-datatable text-nowrap">
                        <DataTableReference
                            tableRef={tableRef}
                            dataTableRef={dataTableRef}
                            url_api={url}
                            method="POST"
                            buttons={actions}
                            title="Productos"
                            setData={setProducts}
                            filtered={false}
                            columns={columns}
                        />
                    </div>
                </div>
            </div>

            <div className="modal fade" ref={modalRef} tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">
                                <i className="ri-product-hunt-line me-2"></i>{product.id ? 'Editar Producto' : 'Nuevo Producto'}
                            </h4>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div className="modal-body">
                            <FormProduct
                                product={product}
                                setProduct={setProduct}
                                setMessage={setMessage}
                                closeModal={closeModal}
                                dataTableRef={dataTableRef}
                                accountingAccountsCodes={accountingAccountsCodes}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProductsIndex;