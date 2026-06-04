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

const UpdateOC = () => {

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
            productId: invoice?.state?.id === 2 || invoice?.state?.id === 4, 
            currencyExchangeId: invoice?.state?.id === 2 || invoice?.state?.id === 4, 
            actions: invoice?.state?.id === 2 || invoice?.state?.id === 4,
            price: invoice?.state?.id === 2 || invoice?.state?.id === 4,
        }
    }, [invoice]);

    const fieldsForm = useMemo(() => {
        return {
            thirdPartyId: true,
            invoiceDate: true,
            lineInvoices: true,
            paymentsForms: invoice?.state?.id === 2 || invoice?.state?.id === 4,
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

                const quantityReceived = data?.invoicesReferences
                ?.reduce((acc: number, curr: any) => acc + curr.lineInvoices.reduce((acc: number, curr: any) => acc + curr.quantity, 0), 0);

                const quantity = invoice?.state?.code === "PENDING_APPROVAL" ?
                line.quantity : line.product?.stock - quantityReceived || 0;

                return {
                    id: line.id,
                    isDeleted: false,
                    productId: line.product?.id || null,
                    product: line.product ? {
                        id: line.product.id,
                        name: line.product.name,
                        description: line.product.description,
                        code: line.product.code,
                        stock: line.product.stock || null
                    } : null,
                    asset: line.asset ? {
                        id: line.asset.id,
                        name: line.asset.name,
                        description: line.asset.description
                    } : null,
                    name: line.name,
                    code: line.code,
                    description: line.description,
                    quantity: quantity,
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
            transaction: null,
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
        console.log(invoice)
        if(invoice?.thirdParty?.id === null) {
            if(invoice?.thirdParty?.isoCode !== company.currencyType.isoCode) {
                setRequireds([...requireds, {
                    id: "exchangeRateId",
                    required: true,
                    message: "El tipo de cambio es requerido"
                }])
            }
        } else {
            setRequireds(requireds.filter((item) => item.id !== "exchangeRateId"))
        }
    }, [invoice])

    useEffect(() => {
        loadData();
    }, [])

    if(!invoice){
        return <PageLoad/>
    }

    if(invoice?.state?.id === 3 || invoice?.state?.id === 5 || invoice?.state?.id === 6){
        const info = {
            title: "",
            description: ""
        }

        switch(invoice?.state?.id){
            case 3:
                info.title = "Orden de compra bloqueada";
                info.description = "La orden de compra no se puede editar porque se encuentra rechazada";
                break;
            case 5:
                info.title = "Orden de compra recibida";
                info.description = "La orden de compra no se puede editar porque ya fue recibida en su totalidad";
                break;
            case 6:
                info.title = "Orden de compra bloqueada";
                info.description = "La orden de compra no se puede editar porque se encuentra cerrada";
                break;
        }

        return <PageBlock
            title={info.title}
            description={info.description}
        />
    }

    const handleSave = async () => {
        try{
            let valid = true;
            let errors = [];
            if(!invoice?.thirdParty?.id){
                errors.push("El proveedor es requerido");
            }
            if(!invoice?.header?.dueDate){
                errors.push("La fecha prevista de entrega es requerida");
            }
            if(invoice?.lineInvoices?.length === 0){
                errors.push("Necesita agregar al menos un item a la factura");
            }
            if(errors.length > 0){
                setMessage({
                    message: errors.join(", "),
                    type: "danger",
                    show: true,
                    time: 3000,
                    html: false
                })
                return;
            }
            const baseUrl = invoice?.state?.code === "APPROVED" || invoice?.state?.code === "PARTIALLY_RECEIVED" ? base_url(["api/v1/invoices/oc/received", id]) : base_url(["api/v1/invoices/oc", id]);
            let data: any;
            if(invoice?.state?.code === "APPROVED" || invoice?.state?.code === "PARTIALLY_RECEIVED") {
                data = await fetchHelper.post(baseUrl, invoice, {}, 1000, true);
            } else if(invoice?.state?.code === "PENDING_APPROVAL") {
                data = await fetchHelper.put(baseUrl, invoice, {}, 1000, true);
            }
            setMessage({
                message: data.message || "Orden de compra guardada exitosamente",
                type: "success",
                show: true,
                time: 3000,
                html: false
            })
            navigate(-1);
            setIsSending(false);
        } catch (error) {
            console.log(error);
            setMessage({
                message: "Error al guardar la orden de compra",
                type: "danger",
                show: true,
                time: 3000,
                html: false
            })
        } finally {
            setIsSending(false);
        }
    }

    return (
        <>
            <div className="card">
                <HeaderForm
                    title={invoice?.state?.id === 2 || invoice?.state?.id === 4 ? "Recibir" : "Editar"}
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
    );
};

export default UpdateOC;