import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { fetchHelper } from "@/utils/fetch";
import { base_url, formatDate, formatPrice, generateInvoiceCode } from "@/utils/functions";
import PageLoad from "@/pages/errors/page_load";
import HeaderForm from "./details/headers";
import FormInvoice from "./details/form";
import LineInvoices from "./details/LineInvoices";
import TotalsInvoice from "./details/totals";
import { mapInvoiceFromApi } from "./utils/mapInvoiceFromApi";
import { InvoiceInterface } from "./interfaces/invoice.interface";

type InvoiceViewProps = {
    partyLabel?: string;
};

const READONLY_FIELDS = {
    thirdPartyId: true,
    productId: true,
    currencyExchangeId: true,
    invoiceDate: true,
    paymentFormId: true,
    paymentMethodId: true,
    paymentDate: true,
    price: true,
    actions: true,
    cashPaymentId: true,
    checkbookId: true,
    checkId: true,
    bankAccountId: true,
};

const VIEW_FIELDS_FORM = {
    thirdPartyId: true,
    invoiceDate: true,
    lineInvoices: true,
    paymentsForms: true,
};

const InvoiceView = ({ partyLabel = "Tercero" }: InvoiceViewProps) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector((state: any) => state.user).user;
    const company = user?.company;

    const [invoice, setInvoice] = useState<InvoiceInterface | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    const documentCode = useMemo(() => {
        if (!invoice) return "";
        return generateInvoiceCode(invoice.header.type.code, String(invoice.header.serial));
    }, [invoice]);

    const loadInvoice = async () => {
        const { data } = await fetchHelper.get(base_url(["api/v1/invoices", id]), {}, 0, false);
        setInvoice(mapInvoiceFromApi(data));
    };

    useEffect(() => {
        loadInvoice();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        setDownloadError("");
        setDownloading(true);
        try {
            const token = localStorage.getItem("token");
            const url = base_url(["api/v1/invoices", id, "pdf"]);
            const response = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err?.msg || err?.message || "No se pudo generar el PDF");
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${documentCode || `factura-${id}`}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (error: any) {
            setDownloadError(error?.message || "Error al descargar el PDF");
        } finally {
            setDownloading(false);
        }
    };

    if (!invoice) {
        return <PageLoad />;
    }

    const pendingAmount =
        (invoice.values?.totalPayment ?? 0) -
        (invoice.vouchers ?? []).reduce((acc, v) => acc + (v.amount ?? 0), 0);

    return (
        <>
            <style>{`
                @media print {
                    .layout-menu,
                    .layout-navbar,
                    .invoice-view-toolbar,
                    .btn,
                    .layout-overlay { display: none !important; }
                    .layout-page { padding: 0 !important; }
                    .invoice-print-area { box-shadow: none !important; }
                }
            `}</style>

            <div className="card invoice-view-toolbar">
                <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                        <h5 className="mb-1">Vista del documento</h5>
                        <p className="text-muted mb-0 small">
                            {documentCode} · {partyLabel}: {invoice.thirdParty?.name}
                        </p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        {/* <button type="button" className="btn btn-label-secondary" onClick={() => navigate(-1)}>
                            <i className="ri-arrow-left-line me-1" /> Volver
                        </button> */}
                        <button type="button" className="btn btn-label-primary" onClick={handlePrint}>
                            <i className="ri-printer-line me-1" /> Imprimir
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleDownloadPdf}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <span className="spinner-border spinner-border-sm me-1" />
                            ) : (
                                <i className="ri-file-pdf-line me-1" />
                            )}
                            Descargar PDF
                        </button>
                    </div>
                </div>
                {downloadError && (
                    <div className="card-footer py-2">
                        <div className="alert alert-danger mb-0 py-2">{downloadError}</div>
                    </div>
                )}
            </div>

            <div id="invoice-print-area" className="invoice-print-area">
                <div className="card mb-4">
                    <HeaderForm
                        title="Ver"
                        type={invoice.header.type}
                        serial={String(invoice.header.serial)}
                    />
                </div>

                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3">

                            <div className="col-12 col-md-3">
                                <small className="text-muted d-block">Tercero</small>
                                <strong>{invoice.thirdParty?.name}</strong>
                            </div>

                            <div className="col-md-3">
                                <small className="text-muted d-block">Estado</small>
                                {invoice.header.status === "PAID" ? (
                                    <span className={`badge bg-label-success`}>Pagado</span>
                                ) : (
                                    <span className="badge bg-label-warning">Pendiente</span>
                                )}
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted d-block">Fecha documento</small>
                                <strong>{formatDate(invoice.header.dueDate, "YYYY-MM-DD")}</strong>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted d-block">Vencimiento / emisión</small>
                                <strong>
                                    {invoice.header.issueDate
                                        ? formatDate(invoice.header.issueDate, "YYYY-MM-DD")
                                        : "N/A"}
                                </strong>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted d-block">Total documento</small>
                                <strong>{formatPrice(invoice.values.totalPayment, company?.currency?.isoCode)}</strong>
                            </div>
                            {(invoice.vouchers?.length ?? 0) > 0 && (
                                <div className="col-md-3">
                                    <small className="text-muted d-block">Saldo pendiente</small>
                                    <strong>{formatPrice(pendingAmount, company?.currency?.isoCode)}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* <div className="card mb-4">
                    <div className="card-body">
                        <FormInvoice
                            invoice={invoice}
                            setInvoice={setInvoice}
                            requireds={[]}
                            fieldsEditable={READONLY_FIELDS}
                            fieldsForm={VIEW_FIELDS_FORM}
                        />
                    </div>
                </div> */}

                <div className="card mb-4">
                    <LineInvoices
                        type={invoice.header.type}
                        invoice={invoice}
                        thirdParty={invoice.thirdParty}
                        exchangeRate={invoice.exchangeRate}
                        setInvoice={setInvoice}
                        fieldsEditable={READONLY_FIELDS}
                        view={true}
                    />
                </div>

                <TotalsInvoice
                    invoice={invoice}
                    company={company}
                    thirdParty={invoice.thirdParty}
                    exchangeRate={invoice.exchangeRate}
                    send={() => {}}
                    isSending={false}
                    readOnly
                />

                {invoice.notes && (
                    <div className="card mb-4">
                        <div className="card-body">
                            <h6 className="mb-2">Notas</h6>
                            <p className="mb-0 text-muted">{invoice.notes}</p>
                        </div>
                    </div>
                )}

                {(invoice.vouchers?.length ?? 0) > 0 && (
                    <div className="card mb-4">
                        <div className="card-header">
                            <h6 className="mb-0">Comprobantes de pago</h6>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-sm mb-0">
                                <thead>
                                    <tr>
                                        <th>Número</th>
                                        <th>Fecha</th>
                                        <th>Monto</th>
                                        <th>Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.vouchers.map((v) => (
                                        <tr key={v.id}>
                                            <td>{v.number}</td>
                                            <td>{formatDate(v.date, "YYYY-MM-DD")}</td>
                                            <td>{formatPrice(v.amount, company?.currency?.isoCode)}</td>
                                            <td>{v.description || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default InvoiceView;
