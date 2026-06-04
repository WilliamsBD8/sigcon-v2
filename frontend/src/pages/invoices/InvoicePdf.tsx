import { formatPrice, generateInvoiceCode } from "@/utils/functions";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";


const styles = StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 10,
      fontFamily: 'Helvetica'
    },
  
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5
    },
  
    section: {
      marginBottom: 15
    },
  
    row: {
      flexDirection: 'row'
    },
  
    col: {
      flex: 1
    },
  
    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#ddd'
    },
  
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f2f2f2'
    },
  
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#ddd'
    },
  
    cell: {
      padding: 6,
      flex: 1
    },
  
    totalBox: {
      alignSelf: 'flex-end',
      width: 200,
      marginTop: 15
    }
  });

interface InvoicePdfProps {
    invoice: any;
    user: any;
}

const InvoicePdf = ({ invoice, user }: InvoicePdfProps) => {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>
                        {invoice?.header?.type?.name}
                    </Text>

                    <Text>
                        {generateInvoiceCode(invoice?.header?.type?.code, invoice?.header?.serial)}
                    </Text>
                </View>
                <View style={[styles.section, styles.row]}>
                    <View style={styles.col}>
                        <Text>Fecha emisión: {invoice?.header?.issueDate}</Text>
                        <Text>Fecha vencimiento: {invoice?.header?.dueDate}</Text>
                    </View>

                    <View style={styles.col}>
                        <Text>Estado: {invoice?.header?.status == "PENDING" ? "Pendiente" : "Pagado"}</Text>
                    </View>
                </View>
                <View style={styles.section}>
                    <Text>{
                        invoice?.header?.type?.code === "FC" ? "Proveedor" : "Cliente"
                    }</Text>

                    <Text>{invoice?.thirdParty?.businessName}</Text>
                    <Text>NIT: {invoice?.thirdParty?.nit}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.cell}>Código</Text>
                        <Text style={styles.cell}>Producto</Text>
                        <Text style={styles.cell}>Cant.</Text>
                        <Text style={styles.cell}>Precio</Text>
                        <Text style={styles.cell}>Total</Text>
                    </View>

                    {invoice?.lineInvoices?.map(line => (
                        <View key={line.id} style={styles.tableRow}>
                        <Text style={styles.cell}>{line.code}</Text>
                        <Text style={styles.cell}>{line.name}</Text>
                        <Text style={styles.cell}>{line.quantity}</Text>
                        <Text style={styles.cell}>
                            {formatPrice(line.price)}
                        </Text>
                        <Text style={styles.cell}>
                            {formatPrice(line.quantity * line.price)}
                        </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.totalBox}>
                    <Text>
                        Subtotal: {formatPrice(invoice?.values?.totalAmount)}
                    </Text>

                    <Text>
                        Descuento: {formatPrice(invoice?.values?.totalDiscount)}
                    </Text>

                    <Text>
                        Impuestos: {formatPrice(invoice?.values?.totalTax)}
                    </Text>

                    <Text style={{ fontWeight: 'bold', marginTop: 5 }}>
                        TOTAL: {formatPrice(invoice?.values?.totalPayment)}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text>COMPROBANTES DE PAGO</Text>

                    {invoice?.vouchers?.map(voucher => (
                        <View key={voucher.id}>
                        <Text>No. {voucher.number}</Text>
                        <Text>Fecha: {voucher.date}</Text>
                        <Text>Método: {voucher.paymentMethod?.name}</Text>
                        <Text>Cuenta: {voucher.bankAccount?.accountNumberMasked}</Text>
                        <Text>Valor: {formatPrice(voucher.amount)}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePdf;