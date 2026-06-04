import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { InvoiceInterface, VoucherInterface } from "@/pages/invoices/interfaces/invoice.interface";
import { base_url } from "@/utils/functions";
import AlertPage from "@/components/molecules/AlertPage";
import { fetchHelper } from "@/utils/fetch";
import PageLoad from "@/pages/errors/page_load";
import HeaderForm from "../details/headers";
import FormInvoice from "../details/form";
import LineInvoices from "../details/LineInvoices";
import TotalsInvoice from "../details/totals";
import PageBlock from "@/pages/errors/page_block";

const EditInvoiceFV = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = useSelector((state: any) => state.user).user;
    const company = user.company;
    const [isSending, setIsSending] = useState(false);
    const [invoice, setInvoice] = useState<InvoiceInterface | null>(null);
    const [message, setMessage] = useState({ message: "", type: "", show: false, time: 3000, html: false });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fieldsEditable = useMemo(() => ({
        thirdPartyId: true,
        productId: false,
        currencyExchangeId: false,
        actions: false,
        price: false,
        paymentFormId: false,
    }), []);

    const fieldsForm = useMemo(() => ({
        thirdPartyId: true,
        invoiceDate: true,
        lineInvoices: true,
        paymentsForms: true,
    }), []);

    const requireds = useMemo(() => [
        { id: "thirdPartyId", required: true, message: "El cliente es requerido" },
        { id: "invoiceDate", required: true, message: "La fecha de venta es requerida" },
        { id: "lineInvoices", required: true, message: "Agregue al menos un producto" },
    ], []);

    const loadData = async () => {
        const { data } = await fetchHelper.get(base_url(["api/v1/invoices", id]), {}, 0, false);
        setInvoice({
            id: data.header.id,
            header: {
                type: {
                    code: data.header.type.code,
                    codeNumber: data.header.type.codeNumber,
                    name: data.header.type.name,
                },
                documentId: data.header.documentId,
                issueDate: data.header.issueDate,
                dueDate: data.header.dueDate,
                status: data.header.status,
                serial: data.header.serial,
            },
            values: data.values,
            state: data.state,
            thirdParty: {
                id: data.thirdParty.id,
                code: data.thirdParty.thirdPartyCode,
                dv: data.thirdParty.dv,
                nit: data.thirdParty.nit,
                name: data.thirdParty.businessName,
                address: data.thirdParty.address,
                city: data.thirdParty.city,
                country: data.thirdParty.country,
                email: data.thirdParty.email,
                isoCode: data.thirdParty.currencyType?.isoCode || '',
            },
            lineInvoices: data.lineInvoices.map((line: any) => ({
                id: line.id,
                isDeleted: false,
                productId: line.product?.id || null,
                product: line.product ? {
                    id: line.product.id,
                    name: line.product.name,
                    description: line.product.description,
                    code: line.product.code,
                    stock: line.product.stock ?? null,
                    price: line.product.price,
                    salePrice: line.product.salePrice ?? line.product.price,
                } : null,
                name: line.name,
                code: line.code,
                description: line.description,
                quantity: line.quantity,
                price: line.price,
                discount: line.discount,
                taxRulesIds: [],
            })),
            notes: data.notes || '',
            exchangeRate: data.exchangeRate ? {
                id: data.exchangeRate.id,
                value: data.exchangeRate.value,
                currencyChanged: data.exchangeRate.currencyExchange.isoCode,
                currencyChangedTo: data.exchangeRate.currencyExchanged.isoCode,
            } : null,
            productId: null,
            product: null,
            transaction: {
                paymentFormId: data.transaction.paymentFormId,
                methodPaymentId: data.transaction.methodPaymentId,
                valuePayment: data.transaction.valuePayment,
                paymentDate: data.transaction.paymentDate,
                bankAccount: data.transaction.bankAccount,
                cashAccount: data.transaction.cashAccount,
                check: data.transaction.check,
            },
            vouchers: data.vouchers?.map((voucher: VoucherInterface) => ({
                id: voucher.id,
                number: voucher.number,
                date: voucher.date,
                amount: voucher.amount,
                description: voucher.description,
            })) ?? [],
        });
    };

    useEffect(() => {
        loadData();
    }, [id]);

    if (!invoice) {
        return <PageLoad />;
    }

    if (invoice.state?.code && invoice.state.code !== 'BILLED') {
        return (
            <PageBlock
                title="Factura no editable"
                description="Solo se pueden editar facturas de venta en estado facturada."
            />
        );
    }

    const handleSave = async () => {
        setIsSending(true);
        try {
            const response = await fetchHelper.put(
                base_url(["api/v1/invoices/fv", id]),
                invoice,
                {},
                1000,
                false
            );
            (window as any).Swal?.fire({
                icon: 'success',
                title: 'Éxito',
                text: response.msg || response.message || 'Factura actualizada',
                confirmButtonText: 'Aceptar',
                customClass: { confirmButton: 'btn btn-primary waves-effect' },
            }).then((result: { isConfirmed: boolean }) => {
                if (result.isConfirmed) navigate(-1);
            });
        } catch (err: any) {
            if (err?.errors?.length) {
                const fieldErrors: Record<string, string> = {};
                err.errors.forEach((e: { field: string; message: string }) => {
                    fieldErrors[e.field] = e.message;
                });
                setErrors(fieldErrors);
            }
            setMessage({ message: err?.msg || 'Error al guardar', type: 'danger', show: true, time: 0, html: false });
            setIsSending(false);
        }
    };

    return (
        <>
            <div className="card">
                <HeaderForm title="Editar" type={invoice.header.type} serial={String(invoice.header.serial)} />
            </div>
            <div className="card">
                <div className="card-body">
                    {message.show && (
                        <AlertPage
                            type={message.type}
                            message={message.message}
                            show={message.show}
                            onChange={() => setMessage({ message: '', type: '', show: false, time: 3000, html: false })}
                            duration={message.time}
                        />
                    )}
                    <FormInvoice
                        invoice={invoice}
                        setInvoice={setInvoice}
                        requireds={requireds}
                        fieldsEditable={fieldsEditable}
                        fieldsForm={fieldsForm}
                        thirdPartyRoleId="1"
                        thirdPartyLabel="Cliente"
                        loadAllProducts
                    />
                </div>
            </div>
            <div className="card">
                <LineInvoices
                    type={invoice.header.type}
                    invoice={invoice}
                    thirdParty={invoice.thirdParty}
                    exchangeRate={invoice.exchangeRate}
                    setInvoice={setInvoice}
                    fieldsEditable={fieldsEditable}
                />
            </div>
            <TotalsInvoice
                invoice={invoice}
                company={company}
                thirdParty={invoice.thirdParty}
                exchangeRate={invoice.exchangeRate}
                send={handleSave}
                isSending={isSending}
            />
        </>
    );
};

export default EditInvoiceFV;
