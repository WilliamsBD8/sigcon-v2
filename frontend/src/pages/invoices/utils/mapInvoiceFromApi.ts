import { InvoiceInterface } from "../interfaces/invoice.interface";

export const mapInvoiceFromApi = (data: any): InvoiceInterface => ({
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
    values: {
        totalPayment: data.values.totalPayment,
        totalAmount: data.values.totalAmount,
        totalDiscount: data.values.totalDiscount,
        totalTax: data.values.totalTax,
    },
    state: data.state
        ? {
              id: data.state.id,
              code: data.state.code,
              name: data.state.name,
              description: data.state.description,
              color: data.state.color,
          }
        : null,
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
        isoCode: data.thirdParty.currencyType?.isoCode || "",
    },
    lineInvoices: (data.lineInvoices ?? []).map((line: any) => ({
        id: line.id,
        isDeleted: false,
        productId: line.product?.id || null,
        product: line.product
            ? {
                  id: line.product.id,
                  name: line.product.name,
                  description: line.product.description,
                  code: line.product.code,
                  stock: null,
              }
            : null,
        asset: line.asset
            ? {
                  id: line.asset.id,
                  name: line.asset.name,
                  description: line.asset.description,
              }
            : null,
        name: line.name,
        code: line.code,
        description: line.description,
        quantity: line.quantity,
        price: line.price,
        discount: line.discount,
        taxRulesIds: line.taxRules ?? [],
    })),
    notes: data.notes || "",
    exchangeRate: data.exchangeRate
        ? {
              id: data.exchangeRate.id,
              value: data.exchangeRate.value,
              currencyChanged: data.exchangeRate.currencyExchange?.isoCode,
              currencyChangedTo: data.exchangeRate.currencyExchanged?.isoCode,
          }
        : null,
    productId: null,
    product: null,
    transaction: {
        id: null,
        bankAccount: null,
        cashAccount: null,
        check: null,
        paymentFormId: data.transaction?.paymentFormId,
        methodPaymentId: data.transaction?.methodPaymentId,
        valuePayment: data.transaction?.valuePayment,
        paymentDate: data.transaction?.paymentDate,
        description: data.transaction?.description,
        file: null,
        reference: null,
    },
    vouchers: (data.vouchers ?? []).map((voucher: any) => ({
        id: voucher.id,
        number: voucher.number,
        date: voucher.date,
        amount: voucher.amount,
        description: voucher.description,
    })),
    invoicesReferences: data.invoicesReferences,
});
