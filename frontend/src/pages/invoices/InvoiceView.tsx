import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import InvoicePdf from "./InvoicePdf";
import { fetchHelper } from "@/utils/fetch";
import { base_url } from "@/utils/functions";

type InvoiceViewProps = {
    partyLabel?: string;
};
const InvoiceView = ({ partyLabel = "Tercero" }: InvoiceViewProps) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector((state: any) => state.user).user;
    const company = user?.company;

    const [invoice, setInvoice] = useState<any | null>(null);

    const loadInvoice = async () => {
        const response = await fetchHelper.get(base_url(['api/v1/invoices', id]), {}, 0, false);
        setInvoice(response.data);
        console.log(response.data);
    }

    useEffect(() => {
        loadInvoice();
    }, []);
    
    return (
        <>
            <div className="card">
                <div className="card-body">
                    <PDFViewer
                        style={{
                            width: "100%",
                            height: "500px",
                            border: "none"
                        }}
                    >
                        <InvoicePdf invoice={invoice} user={user} />
                    </PDFViewer>
                </div>
                <div className="card-footer">
                <PDFDownloadLink
                            document={<InvoicePdf invoice={invoice} user={user} />}
                            fileName={`invoice.pdf`}
                        >
                            {({ loading }) => (
                                <button
                                    className="btn btn-danger"
                                    disabled={loading}
                                >
                                    <i className="ri-file-pdf-line me-2"></i>
                                    {loading ? "Generando..." : "Descargar PDF"}
                                </button>
                            )}
                        </PDFDownloadLink>
                </div>
            </div>
        </>
    );
};

export default InvoiceView;
