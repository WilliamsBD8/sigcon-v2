import { VoucherTypeInterface } from "@/pages/vouchers/interfaces/voucher.interfaces";

export interface PaymentInterface {
    id: string | number | null;
    thirdPartyId: string | number | null;
    valuePayment: number | null;
    paymentFormId: string | number | null;
    methodPaymentId: string | number | null;
    bankAccount: BankAccountInterface | null;
    cashAccount: CashAccountInterface | null;
    check: CheckInterface | null;
    paymentDate: string | null;
    description: string | null;
    file: FileInterface | null;
    reference: string | null;
    number: string | number | null;
    voucherType: VoucherTypeInterface | null;
    lines: LinesAccoountingInterface[] | null;
}

export interface BankAccountInterface { 
    id: string | number | null;
    accountNumber: string | null;
}

export interface CashAccountInterface {
    id: string | number | null;
    accountNumber: string | null;
}

export interface CheckInterface {
    id: string | number | null;
    checkbookId: string | number | null;
    numberCheck: string | number | null;
    checkbookNumber: string | null;
}

export interface PaymentFormInterface {
    id: string | number | null;
    name: string | null;
    code: string | null;
}

export interface PaymentMethodInterface {
    id: string | number | null;
    name: string | null;
    code: string | null;
}

export interface FileInterface {
    base64: string | null;
    name: string | null;
}

export interface LinesAccoountingInterface {
    id: string | number | null;
    accountingAccountCode: string | null;
    type: TypeLinesAccoountingInterface;
    amount: number | null;
}

export type TypeLinesAccoountingInterface =
    | "CREDIT"
    | "DEBIT";