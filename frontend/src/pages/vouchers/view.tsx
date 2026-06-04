import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { PaymentInterface } from "../invoices/interfaces/payments.interface";
import { VoucherPdf } from "./voucherPdf";
import { ThirdPartyInterface } from "../invoices/interfaces/invoice.interface";
import { generateVoucherCode } from "@/utils/functions";

interface ViewVoucherProps {
    voucher: PaymentInterface;
    closeViewVoucher: () => void;
    modalRef: any;
    thirdParty: ThirdPartyInterface;
    user: any;
    accountingAccounts: any;
}

const ViewVoucher = ({ voucher, closeViewVoucher, modalRef, thirdParty, user, accountingAccounts }: ViewVoucherProps) => {
    return (
        <div className="modal fade" ref={modalRef} tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Comprobante {voucher.voucherType?.name} {generateVoucherCode(voucher.number)}</h5>
                    </div>
                    <div className="modal-body">
                        <PDFViewer
                            style={{
                                width: "100%",
                                height: "680px",
                                border: "none"
                            }}
                        >
                            <VoucherPdf voucher={voucher} logo={"logo"} thirdParty={thirdParty} user={user} accountingAccounts={accountingAccounts} />
                        </PDFViewer>
                    </div>
                    <div className="modal-footer">
                    <PDFDownloadLink
                            document={<VoucherPdf voucher={voucher} logo={"logo"} thirdParty={thirdParty} user={user} accountingAccounts={accountingAccounts} />}
                            fileName={`voucher-${voucher.number}.pdf`}
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
            </div>
        </div>
    )
}

export default ViewVoucher;