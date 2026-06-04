import { useEffect, useMemo, useState } from "react";
import { InvoiceInterface } from "../interfaces/invoice.interface";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PageLoad from "@/pages/errors/page_load";
import HeaderForm from "../details/headers";
import FormInvoice from "../details/form";
import LineInvoices from "../details/LineInvoices";
import TotalsInvoice from "../details/totals";
import { base_url } from "@/utils/functions";
import { fetchHelper } from "@/utils/fetch";
import AlertPage from "@/components/molecules/AlertPage";

const CreateInvoiceFV = () => {
    const [invoice, setInvoice] = useState<InvoiceInterface | null>({
        id: '',
        transaction: { paymentFormId: 1, methodPaymentId: null, valuePayment: 0 },
        header: {
            type: { code: 'FV', codeNumber: 1, name: 'Factura de Venta' },
            documentId: '',
            issueDate: '',
            dueDate: '',
            status: 'PENDING',
            serial: "X",
        },
        values: { totalPayment: 0, totalAmount: 0, totalDiscount: 0, totalTax: 0 },
        state: null,
        thirdParty: {
            id: '', code: '', nit: '', dv: '', name: '', address: '', city: '', country: '', email: '', isoCode: '',
        },
        lineInvoices: [],
        notes: '',
        exchangeRate: null,
        productId: null,
        product: null,
        vouchers: [],
    });
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState({ message: "", type: "", show: false, time: 3000, html: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const user = useSelector((state: any) => state.user).user;
    const company = user.company;

    const requireds = useMemo(() => [
        { id: "thirdPartyId", required: true, message: "El cliente es requerido" },
        { id: "invoiceDate", required: true, message: "La fecha de venta es requerida" },
        { id: "lineInvoices", required: true, message: "Agregue al menos un producto" },
        { id: "paymentFormId", required: true, message: "La forma de pago es requerida" },
    ], []);

    const fieldsEditable = useMemo(() => ({
        thirdPartyId: false,
        invoiceDate: false,
        lineInvoices: false,
        paymentFormId: false,
    }), []);

    const fieldsForm = useMemo(() => ({
        thirdPartyId: true,
        invoiceDate: true,
        lineInvoices: true,
        paymentsForms: true,
    }), []);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    if (isLoading || !invoice) {
        return <PageLoad />;
    }

    const handleSend = async () => {
        try {
            const url = base_url(['api/v1/invoices/fv/create']);
            const invoiceSend = {
                ...invoice,
                lineInvoices: invoice.lineInvoices.map((item) => ({
                    ...item,
                    id: Number(item.id) ? Number(item.id) : null,
                })),
            };
            const response = await fetchHelper.post(url, invoiceSend, {}, 1, false);
            (window as any).Swal?.fire({
                icon: 'success',
                title: 'Éxito',
                text: response.msg || response.message || 'Factura de venta creada correctamente',
                confirmButtonText: 'Aceptar',
                customClass: { confirmButton: 'btn btn-primary waves-effect' },
                allowOutsideClick: false,
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
            } else if (err?.msg) {
                setError({ message: err.msg, type: 'danger', show: true, time: 0, html: false });
            }
        }
    };

    return (
        <>
            <div className="card">
                <HeaderForm title="Crear" type={invoice.header.type} serial={String(invoice.header.serial)} />
            </div>
            <div className="card">
                <div className="card-body">
                    {error.show && (
                        <AlertPage
                            type={error.type}
                            message={error.message}
                            show={error.show}
                            onChange={() => setError({ message: '', type: '', show: false, time: 3000, html: false })}
                            duration={error.time}
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
                send={handleSend}
                isSending={false}
            />
        </>
    );
};

export default CreateInvoiceFV;
