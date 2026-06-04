import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import DataTableReference from '../../components/organism/DataTable';
import AlertPage from '../../components/molecules/AlertPage';
import { fetchHelper } from '../../utils/fetch';
import { base_url, formatDate, formatPrice } from '../../utils/functions';
import VoucherFormModal from './VoucherFormModal';
import {
    emptyVoucher,
    mapDetailToForm,
    mapVoucherToPayload,
    needsManualAccountingLines,
    requiresEmployeeThirdParty,
    validateAccountingLines,
} from './voucherUtils';

const IndexVouchersOld = () => {
    const user = useSelector((state) => state.user?.user);
    const company = user?.company;
    const userPermissions = user?.permissions?.filter((p) => p.code.includes('VOUCHER')) || [];
    const isAdmin = user?.isAdmin || false;

    const tableRef = useRef(null);
    const dataTableRef = useRef(null);
    const modalRef = useRef(null);
    const modalInstance = useRef(null);
    const detailModalRef = useRef(null);
    const detailModalInstance = useRef(null);

    const [message, setMessage] = useState({ message: '', type: '', show: false });
    const [errorForm, setErrorForm] = useState({ message: '', type: '', show: false });
    const [voucher, setVoucher] = useState({ ...emptyVoucher });
    const [detailVoucher, setDetailVoucher] = useState({ ...emptyVoucher });
    const [isSending, setIsSending] = useState(false);
    const [readOnly, setReadOnly] = useState(false);

    const [voucherTypes, setVoucherTypes] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [cashPayments, setCashPayments] = useState([]);
    const [checkBooks, setCheckBooks] = useState([]);
    const [checks, setChecks] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);

    const canCreate = userPermissions.includes('CREATE_VOUCHER') || isAdmin;
    const canUpdate = userPermissions.includes('UPDATE_VOUCHER') || isAdmin;
    const canDelete = userPermissions.includes('DELETE_VOUCHER') || isAdmin;

    const openModal = (ref, instanceRef) => {
        if (!instanceRef.current) {
            instanceRef.current = new window.bootstrap.Modal(ref.current);
        }
        instanceRef.current.show();
    };

    const closeModal = (instanceRef) => {
        instanceRef.current?.hide();
    };

    const loadCatalogs = async () => {
        const typesRes = await fetchHelper.get(
            `${base_url(['api', 'v1', 'vouchers', 'types'])}?standalone=true`,
            {},
            0,
            false
        );
        setVoucherTypes(typesRes?.data ?? []);

        const { data: dataPaymentMethods } = await fetchHelper.post(
            base_url(['api/v1/resources/payment-methods']),
            { length: -1 },
            {},
            0,
            false
        );
        setPaymentMethods(dataPaymentMethods.map((d) => ({ id: d.id, code: d.code, name: d.name })));

        const { data: dataCashPayments } = await fetchHelper.post(
            base_url(['api/v1/cash/search']),
            { length: -1 },
            {},
            0,
            false
        );
        setCashPayments(dataCashPayments.map((d) => ({ id: d.id, code: d.code, name: d.name })));

        const { data: dataCheckBooks } = await fetchHelper.post(
            base_url(['api/v1/banks/checkbooks/search']),
            { length: -1 },
            {},
            0,
            false
        );
        setCheckBooks(dataCheckBooks.map((d) => ({ id: d.id, code: d.code, name: d.name })));

        const { data: dataBankAccounts } = await fetchHelper.post(
            base_url(['api/v1/bank-accounts/search']),
            { length: -1 },
            {},
            0,
            false
        );
        setBankAccounts(dataBankAccounts.map((d) => ({
            id: d.id,
            name: `${d.accountNumberMasked} - ${d.accountName}`,
            type: d.accountType,
        })));
    };

    const reloadTable = () => {
        dataTableRef.current?.ajax?.reload(null, false);
    };

    useEffect(() => {
        loadCatalogs();
    }, []);

    const columns = useMemo(() => [
        {
            title: 'Tipo',
            data: 'voucherType.name',
            name: 'voucherType.name',
            defaultContent: '-',
        },
        { title: 'Número', data: 'number', name: 'number' },
        {
            title: 'Fecha',
            data: 'date',
            name: 'date',
            render: (data) => formatDate(data, 'YYYY-MM-DD'),
        },
        {
            title: 'Monto',
            data: 'amount',
            name: 'amount',
            render: (data) => formatPrice(data, company?.currency?.isoCode ?? 'COP'),
        },
        { title: 'Descripción', data: 'description', name: 'description', defaultContent: '-' },
        {
            title: 'Empleado / tercero',
            data: 'thirdParty.businessName',
            name: 'thirdParty.businessName',
            defaultContent: '-',
        },
        {
            title: 'Acciones',
            data: 'id',
            orderable: false,
            searchable: false,
            render: (id) => `
                <div class="d-flex gap-1">
                    <a class="btn btn-sm btn-text-info rounded-pill btn-icon action-btn"
                        data-action="view" data-id="${id}" title="Ver">
                        <i class="ri-eye-line"></i>
                    </a>
                    ${canUpdate ? `<a class="btn btn-sm btn-text-primary rounded-pill btn-icon action-btn"
                        data-action="edit" data-id="${id}" title="Editar">
                        <i class="ri-pencil-line"></i>
                    </a>` : ''}
                    ${canDelete ? `<a class="btn btn-sm btn-text-danger rounded-pill btn-icon action-btn"
                        data-action="delete" data-id="${id}" title="Eliminar">
                        <i class="ri-delete-bin-line"></i>
                    </a>` : ''}
                </div>
            `,
        },
    ], [canUpdate, canDelete, company]);

    const buttons = useMemo(() => (
        canCreate ? [{
            text: '<i class="ri-add-line me-1"></i> Nuevo comprobante',
            className: 'btn btn-primary waves-effect mx-2 my-2',
            action: () => {
                setReadOnly(false);
                setErrorForm({ message: '', type: '', show: false });
                setVoucher({ ...emptyVoucher, paymentDate: new Date().toISOString().slice(0, 10) });
                openModal(modalRef, modalInstance);
            },
        }] : []
    ), [canCreate]);

    useEffect(() => {
        const table = dataTableRef.current;
        if (!table) return;

        const handler = async function () {
            const action = $(this).data('action');
            const id = Number($(this).data('id'));

            try {
                const { data } = await fetchHelper.get(base_url(['api', 'v1', 'vouchers', id]), {}, 0, false);
                const formData = mapDetailToForm(data);

                if (action === 'view') {
                    setDetailVoucher(formData);
                    setReadOnly(true);
                    openModal(detailModalRef, detailModalInstance);
                    return;
                }

                if (action === 'edit' && canUpdate) {
                    setReadOnly(false);
                    setVoucher(formData);
                    setErrorForm({ message: '', type: '', show: false });
                    openModal(modalRef, modalInstance);
                    return;
                }

                if (action === 'delete' && canDelete) {
                    const result = await window.Swal.fire({
                        title: '¿Eliminar comprobante?',
                        text: 'Esta acción no se puede deshacer.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar',
                    });
                    if (!result.isConfirmed) return;
                    await fetchHelper.delete(base_url(['api', 'v1', 'vouchers', 'delete', id]), {}, {}, 1, false);
                    reloadTable();
                    setMessage({ message: 'Comprobante eliminado correctamente', type: 'success', show: true });
                }
            } catch (err) {
                setMessage({ message: err?.msg || 'No fue posible completar la acción', type: 'danger', show: true });
            }
        };

        table.on('click', '.action-btn', handler);
        return () => table.off('click', '.action-btn', handler);
    }, [canUpdate, canDelete]);

    const handleSave = async () => {
        setErrorForm({ message: '', type: '', show: false });

        const selectedType = voucherTypes.find((t) => t.id === voucher.voucherTypeId)
            ?? voucherTypes.find((t) => t.code === voucher.voucherTypeCode);

        if (requiresEmployeeThirdParty(selectedType?.code ?? voucher.voucherTypeCode) && !voucher.thirdPartyId) {
            setErrorForm({ message: 'Seleccione el empleado para el comprobante de nómina.', type: 'danger', show: true });
            return;
        }

        // if (needsManualAccountingLines(selectedType, voucher.invoiceId)) {
        //     const linesError = validateAccountingLines(
        //         voucher.lines,
        //         voucher.valuePayment,
        //         selectedType?.code ?? voucher.voucherTypeCode
        //     );
        //     if (linesError) {
        //         setErrorForm({ message: linesError, type: 'danger', show: true });
        //         return;
        //     }
        // }

        console.log(voucher)

        if(voucher.voucherTypeCode === 'SERVICE_PAYMENT' || voucher.voucherTypeCode === 'SERVICE_RECEIPT') {
            if(voucher.lines.length < 1){
                setErrorForm({ message: 'Debe existir al menos una línea contable', type: 'danger', show: true });
                return;
            }
        }

        setIsSending(true);
        try {
            const payload = mapVoucherToPayload(voucher);
            let response;
            if (voucher.id) {
                response = await fetchHelper.put(
                    base_url(['api', 'v1', 'vouchers', 'update', voucher.id]),
                    payload,
                    {},
                    0,
                    false
                );
            } else {
                response = await fetchHelper.post(
                    base_url(['api', 'v1', 'vouchers', 'create']),
                    payload,
                    {},
                    0,
                    false
                );
            }
            closeModal(modalInstance);
            reloadTable();
            setMessage({ message: response?.message || 'Comprobante guardado', type: 'success', show: true });
        } catch (err) {
            setErrorForm({
                message: err?.msg || 'Error al guardar el comprobante',
                type: 'danger',
                show: true,
            });
        } finally {
            setIsSending(false);
        }
    };

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
                        <AlertPage
                            message={message.message}
                            type={message.type}
                            show={message.show}
                            duration={4000}
                            html={false}
                            onChange={() => setMessage({ message: '', type: '', show: false })}
                        />
                    )}
                    <DataTableReference
                        tableRef={tableRef}
                        dataTableRef={dataTableRef}
                        columns={columns}
                        url_api={['api', 'v1', 'vouchers', 'search']}
                        postPayload={{ standaloneOnly: true }}
                        buttons={buttons}
                        title="Comprobantes"
                        reload={0}
                    />
                </div>
            </div>

            <VoucherFormModal
                modalRef={modalRef}
                voucher={voucher}
                setVoucher={setVoucher}
                voucherTypes={voucherTypes}
                paymentMethods={paymentMethods}
                cashPayments={cashPayments}
                checkBooks={checkBooks}
                checks={checks}
                bankAccounts={bankAccounts}
                error={errorForm}
                isSending={isSending}
                onSave={handleSave}
                readOnly={false}
                type="create"
            />

            <VoucherFormModal
                modalRef={detailModalRef}
                voucher={detailVoucher}
                setVoucher={setDetailVoucher}
                voucherTypes={voucherTypes}
                paymentMethods={paymentMethods}
                cashPayments={cashPayments}
                checkBooks={checkBooks}
                checks={checks}
                bankAccounts={bankAccounts}
                error={{ show: false }}
                isSending={false}
                onSave={() => {}}
                readOnly
                type="view"
            />
        </>
    );
};

export default IndexVouchersOld;
