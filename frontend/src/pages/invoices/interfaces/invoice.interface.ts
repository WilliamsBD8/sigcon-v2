// Interfaz para facturas

import { PaymentInterface } from "./payments.interface";

export interface InvoiceInterface {
    id: string | number | null;
    header: HeaderInterface | null;
    thirdParty: ThirdPartyInterface | null;
    state: InvoiceStateInterface | null;
    lineInvoices: LineInvoiceInterface[] | [];
    notes: string | null;
    exchangeRate: ExchangeRateInterface | null;
    productId: string | number | null;
    product: ProductInterface | null;
    transaction: PaymentInterface | null;
    vouchers: PaymentInterface[];
    values: ValuesInterface | null;
}

export interface HeaderInterface {
    type: TypeInterface;
    documentId: string;
    issueDate: string;
    dueDate: string;
    status: string;
    serial: string | number | null
}

export interface TypeInterface {
    code: string;
    codeNumber: number;
    name: string;
}

export interface ThirdPartyInterface {
    id: string;
    code: string | null | undefined;
    dv: string | null | undefined;
    nit: string;
    name: string;
    address: string;
    city: string;
    country: string;
    email: string;
    isoCode: string;
}

export interface LineInvoiceInterface {
    id: string | number | null;
    productId: string | number | null;
    product: ProductInterface | null;
    asset: AssetInterface | null;
    code: string | null;
    name: string | null;
    description: string | null;
    quantity: number | null;
    price: number | null;
    taxRulesIds: TaxRuleInterface[] | [];
    retentions: RetentionInterface[] | [];
    discount: DiscountInterface | null;
    isDeleted: boolean | false;
}

export interface AssetInterface {
    id: string | null;
    name: string;
    description: string;
}

export interface ProductInterface {
    id: string | number | null;
    name: string;
    description: string;
    code: string | null;
    stock: number | null;
    price: number | null;
    salePrice?: number | null;
}

export interface TaxRuleInterface {
    id: string;
    taxId: string;
    percentage: number;
    value: number;
}

export interface RetentionInterface {
    id: string;
    taxId: string;
    percentage: number;
    value: number;
}

export interface DiscountInterface {
    percentage: number;
    value: number;
}

export interface ExchangeRateInterface {
    id: string | number | null;
    value: number | null;
    currencyChanged: string | null;
    currencyChangedTo: string | null;
}

export interface InvoiceStateInterface {
    id: string | number | null;
    code: string;
    name: string;
    description: string;
    color: string;
}

export interface VoucherInterface {
    id: string | number | null;
    number: number | null;
    date: string | null;
    amount: number | null;
    description: string | null;
}

export interface ValuesInterface {
    totalPayment: number | null;
    totalAmount: number | null;
    totalDiscount: number | null;
    totalTax: number | null;
}