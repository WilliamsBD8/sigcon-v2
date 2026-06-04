import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { PaymentInterface } from "../invoices/interfaces/payments.interface";
import { formatPrice, generateVoucherCode } from "@/utils/functions";
import { ThirdPartyInterface } from "../invoices/interfaces/invoice.interface";
import { useEffect, useState } from "react";

interface VoucherPdfProps {
    voucher: PaymentInterface;
    logo: string;
    thirdParty: ThirdPartyInterface;
    user: any;
    accountingAccounts: any;
}

const styles = StyleSheet.create({
    page: {
        padding: 15,
        fontFamily: "Helvetica",
        fontSize: 9,
    },

    header: {
        textAlign: "center",
        marginBottom: 10,
        borderBottom: "1 solid #000",
        paddingBottom: 5,
    },

    companyName: {
        fontSize: 14,
        fontWeight: "bold",
    },

    documentTitle: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: "bold",
    },

    section: {
        marginBottom: 8,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },

    label: {
        fontWeight: "bold",
    },

    amountBox: {
        borderTop: "1 solid #000",
        borderBottom: "1 solid #000",
        paddingVertical: 8,
        marginTop: 10,
        marginBottom: 15,
    },

    amountText: {
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "right",
    },

    signature: {
        marginTop: 30,
        textAlign: "center",
    },

    signatureLine: {
        borderTop: "1 solid #000",
        width: 180,
        alignSelf: "center",
        marginBottom: 5,
    },

    footer: {
        marginTop: 20,
        textAlign: "center",
        fontSize: 8,
        color: "grey",
    }
});

export const VoucherPdf = ({ voucher, logo, thirdParty, user, accountingAccounts }: VoucherPdfProps) => {

    const company = user?.company;
    const [nameType, setNameType] = useState("");

    const [lines, setLines] = useState([]);

    useEffect(() => {
        console.log(thirdParty, "thirdParty");
    }, [thirdParty]);
    
    useEffect(() => {
        console.log(voucher, "voucher");
        console.log(accountingAccounts, "accountingAccounts");
        if(voucher?.lines?.length > 0) {
            setLines(voucher.lines.map((line) => {
                console.log(line, "line");
                const accountingAccount = accountingAccounts.find((accountingAccount: any) => accountingAccount.pucAccount.code == line.accountingAccountCode);
                console.log(accountingAccount, "accountingAccount");
                return {
                    ...line,
                    accountingAccountName: accountingAccount?.pucAccount.name,
                };
            }));
        }
    }, [voucher]);

    useEffect(() => {
        switch(voucher.voucherType?.code) {
            case "PAYMENT":
            case "SERVICE_PAYMENT":
                setNameType("Proveedor");
                break;
            case "RECEIPT":
            case "SERVICE_RECEIPT":
                setNameType("Cliente");
                break;
            case "PAYROLL":
                setNameType("Empleado");
                break;
        }
    }, [voucher.voucherType?.code]);

    return (
        <Document>
            <Page size="A6" orientation="landscape" style={styles.page}>

                <View style={styles.header}>
                    <Text style={styles.companyName}>
                        SIGCON
                    </Text>

                    <Text style={styles.documentTitle}>
                        {company?.name} - {company?.nit}
                        {company?.dv != null ? "-" + company?.dv : ""}
                    </Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Comprobante:</Text>
                        <Text>
                            {voucher?.voucherType?.name} - {generateVoucherCode(voucher.number)}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha:</Text>
                        <Text>{voucher.paymentDate}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>{nameType}:</Text>
                        <Text>
                            {thirdParty?.name}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Documento:</Text>
                        <Text>
                            {thirdParty?.nit}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Concepto:</Text>

                    <Text>
                        {voucher.description || "Pago registrado"}
                    </Text>
                </View>

                {lines.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.label}>Detalles </Text>
                        {lines.map((line) => (
                            <View style={styles.row} key={line.id}>
                                <Text>{line.accountingAccountName}</Text>
                                <Text>{line.type == "DEBIT" ? "Débito" : "Crédito"}</Text>
                                <Text>{formatPrice(Number(line.amount), user?.company?.currency?.isoCode)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.amountBox}>
                    <Text style={styles.amountText}>
                        VALOR PAGADO: {formatPrice(Number(voucher.valuePayment), user?.company?.currency?.isoCode)}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text>Documento generado por SIGCON</Text>
                </View>

                </Page>
        </Document>
    );
};