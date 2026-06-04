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

const CreateInvoiceFC = () => {
    
    const [invoice, setInvoice] = useState<InvoiceInterface | null>({
        id: '',
        transaction: null,
        header: {
            type: {
                code: 'FC',
                codeNumber: 4,
                name: 'Factura de Compra'
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
            dv: '',
            name: '',
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
        vouchers: []
    });
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState({
        message: "",
        type: "",
        show: false,
        time: 3000,
        html: false,
    });

    const [errors, setErrors] = useState({})

    const user = useSelector((state: any) => state.user).user;
    const company = user.company;

    const [requireds, setRequireds] = useState<any[]>([
        {
            id: "thirdPartyId",
            required: true,
            message: "El proveedor es requerido"
        },
        {
            id: "invoiceDate",
            required: true,
            message: "La fecha de emisión es requerida"
        },
        {
            id: "lineInvoices",
            required: true,
            message: "Necesita agregar al menos un item a la factura"
        },
        {
            id: "paymentFormId",
            required: true,
            message: "La forma de pago es requerida"
        }
    ]);

    const fieldsEditable = useMemo(() => { // True para decir que es disabled
        return {
            thirdPartyId: false,
            invoiceDate: false,
            lineInvoices: false,
            paymentFormId: false
        }
    }, [invoice]);

    const fieldsForm = useMemo(() => {
        return {
            thirdPartyId: true,
            invoiceDate: true,
            lineInvoices: true,
            paymentsForms: true
        }
    }, [invoice]);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    if(isLoading){
        return <PageLoad/>
    }

    const handleSend = async () => {
        try{
            const url = base_url(['api/v1/invoices/fc/create']);
            let invoiceSend = invoice;
            invoiceSend.lineInvoices = invoiceSend.lineInvoices.map(item => ({
                ...item,
                id: Number(item.id) ? Number(item.id) : null
            }));
            const response = await fetchHelper.post(url, invoiceSend, {}, 1, false);
            (window as any).Swal?.fire({
                icon: 'success',
                title: 'Éxito',
                text: response.msg || response.message || 'Factura creada correctamente',
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
            console.log(error, "error");
            if (error?.errors?.length) {
                const fieldErrors = {};
                error.errors.forEach((e: any) => { fieldErrors[e.field] = e.message; });
                setErrors(fieldErrors);
            } else if (error?.msg) {
                setError({ message: error.msg, type: 'danger', show: true, time: 0, html: false });
            }
        }
    }


    return (
        <>
            <div className="card">
                <HeaderForm
                    title={'Crear'}
                    type={invoice?.header.type}
                    serial={String(invoice.header.serial)}
                />
            </div>
        
            {/* Encabezado */}
            <div className="card">
                <div className="card-body">

                    {
                        error.show && (
                            <AlertPage
                                type={error.type}
                                message={error.message}
                                show={error.show}
                                onChange={() => setError({ message: '', type: '', show: false, time: 3000, html: false })}
                                duration={error.time}
                            />
                        )
                    }

                    <FormInvoice
                        invoice={invoice}
                        setInvoice={setInvoice}
                        requireds={requireds}
                        fieldsEditable={fieldsEditable}
                        fieldsForm={fieldsForm}
                    />
                </div>
            </div>

            {/* Lista de items */}
            <div className="card">
                <LineInvoices
                    type={invoice?.header?.type}
                    invoice={invoice}
                    thirdParty={invoice?.thirdParty}
                    exchangeRate={invoice?.exchangeRate}
                    setInvoice={setInvoice}
                    fieldsEditable={fieldsEditable}
                />
            </div>

            <TotalsInvoice
                invoice={invoice} 
                company={company}
                thirdParty={invoice?.thirdParty}
                exchangeRate={invoice?.exchangeRate}
                send={handleSend}
                isSending={false}

            />
        
        </>
    )
}

export default CreateInvoiceFC;