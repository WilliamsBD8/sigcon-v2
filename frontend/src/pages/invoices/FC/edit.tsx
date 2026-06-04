import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

const EditInvoiceFC = () => {

    const navigate = useNavigate();

    const user = useSelector((state: any) => state.user).user;
    const company = user.company;

    const [isSending, setIsSending] = useState<boolean>(false);

    const { id } = useParams();
    const [invoice, setInvoice] = useState<InvoiceInterface | null>(null);

    const fieldsEditable = useMemo(() => {
        return {
            thirdPartyId: true,
            // invoiceDate: invoice?.state?.id === 2 || invoice?.state?.id === 4, 
            productId: invoice?.transaction?.paymentFormId === 2 && invoice?.vouchers?.length > 0, 
            currencyExchangeId: invoice?.state?.id === 2 || invoice?.state?.id === 4, 
            actions: invoice?.vouchers?.length > 0,
            price: invoice?.vouchers?.length > 0,
            paymentFormId: invoice?.transaction?.paymentFormId === 2,
            paymentDate: invoice?.vouchers?.length > 0,
        }
    }, [invoice]);

    const fieldsForm = useMemo(() => {
        return {
            thirdPartyId: true,
            invoiceDate: true,
            lineInvoices: true,
            paymentsForms: invoice?.transaction?.paymentFormId === 2,
        }
    }, [invoice]);

    const [requireds, setRequireds] = useState<any[]>([
        {
            id: "thirdPartyId",
            required: true,
            message: "El proveedor es requerido"
        },
        {
            id: "invoiceDate",
            required: true,
            message: "La fecha prevista de entrega es requerida"
        },
        {
            id: "lineInvoices",
            required: true,
            message: "Necesita agregar al menos un item a la factura"
        },
        ...(invoice?.state?.id === 2 ? [
            {
                id: "paymentFormId",
                required: true,
                message: "La forma de pago es requerida"
            },
            {
                id: "methodPaymentId",
                required: true,
                message: "El método de pago es requerido"
            }
        ] : [])
    ]);

    const [message, setMessage] = useState({
        message: "",
        type: "",
        show: false,
        time: 3000,
        html: false,
    });

    const [errors, setErrors] = useState<any>({});

    const loadData = async () => {
        const baseUrl = base_url(["api/v1/invoices", id]);
        const { data } = await fetchHelper.get(baseUrl, {}, 0, false);
        setInvoice({
            id: data.header.id,
            header: {
                type: {
                    code: data.header.type.code,
                    codeNumber: data.header.type.codeNumber,
                    name: data.header.type.name
                },
                documentId: data.header.documentId,
                issueDate: data.header.issueDate,
                dueDate: data.header.dueDate,
                status: data.header.status,
                serial: data.header.serial
            },
            values: {
                totalPayment: data.values.totalPayment,
                totalAmount: data.values.totalAmount,
                totalDiscount: data.values.totalDiscount,
                totalTax: data.values.totalTax
            },
            state: data.state ? {
                id: data.state.id,
                code: data.state.code,
                name: data.state.name,
                description: data.state.description,
                color: data.state.color
            } : null,
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
                isoCode: data.thirdParty.currencyType?.isoCode || ''
            },
            lineInvoices: data.lineInvoices.map((line: any) => {

                return {
                    id: line.id,
                    isDeleted: false,
                    productId: line.product?.id || null,
                    product: line.product ? {
                        id: line.product.id,
                        name: line.product.name,
                        description: line.product.description,
                        code: line.product.code,
                        stock: null
                    } : null,
                    asset: line.asset ? {
                        id: line.asset.id,
                        name: line.asset.name,
                        description: line.asset.description
                    } : null,
                    name: line.name,
                    code: line.code,
                    description: line.description,
                    quantity: line.quantity,
                    price: line.price,
                    discount: line.discount,
                    taxRulesIds: []
                }
            }),
            notes: data.notes || '',
            exchangeRate: data.exchangeRate ? {
                id: data.exchangeRate.id,
                value: data.exchangeRate.value,
                currencyChanged: data.exchangeRate.currencyExchange.isoCode,
                currencyChangedTo: data.exchangeRate.currencyExchanged.isoCode
            } : null,
            productId: null,
            product: null,
            transaction: {
                id: null,
                bankAccount: null,
                cashAccount: null,
                check: null,
                paymentFormId: data.transaction.paymentFormId,
                methodPaymentId: data.transaction.methodPaymentId,
                valuePayment: data.transaction.valuePayment,
                paymentDate: data.transaction.paymentDate,
                description: data.transaction.description,
                file: null,
                reference: null
            },
            vouchers: data.vouchers?.map((voucher: VoucherInterface) => {
                return {
                    id: voucher.id,
                    number: voucher.number,
                    date: voucher.date,
                    amount: voucher.amount,
                    description: voucher.description
                }
            })
        })
    }

    useEffect(() => {
        loadData();
    }, [])

    if(!invoice){
        return <PageLoad/>
    }

    if(invoice.header.status === "PAID"){
        return <PageBlock
            title="Factura pagada"
            description="La factura no puede ser editada porque ya ha sido pagada"
        />
    }

    const handleSave = async () => {
        setIsSending(true);
        try{
        const baseUrl = base_url(["api/v1/invoices/fc", id]);
            const response = await fetchHelper.put(baseUrl, invoice, {}, 1000, false);
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
            console.error(error);
            if (error?.errors?.length) {
                const fieldErrors = {};
                error.errors.forEach((e: any) => { fieldErrors[e.field] = e.message; });
                setErrors(fieldErrors);
            } else if (error?.msg) {
                setMessage({ message: error.msg, type: 'danger', show: true, time: 0, html: false });
            }
            setIsSending(false);
            setMessage({ message: error.msg || 'Error al guardar la factura', type: 'danger', show: true, time: 0, html: false });
        }
    }

    return (
        <>
            <div className="card">
                <HeaderForm
                    title={"Editar"}
                    type={invoice?.header.type}
                    serial={String(invoice.header.serial)}
                />
            </div>

            {/* Encabezado */}
            <div className="card">
                <div className="card-body">
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
                send={handleSave}
                isSending={isSending}

            />

        </>
    )
}

export default EditInvoiceFC;