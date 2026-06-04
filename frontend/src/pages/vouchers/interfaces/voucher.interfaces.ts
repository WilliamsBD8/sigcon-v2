export interface VoucherTypeInterface {
    id: string | number | null;
    name: string | null;
    code: string | null;
}

export interface AccountingAccountInterface {
    id: string | number | null;
    code: string | null;
    name: string | null;
    description: string | null;
    type: 'debit' | 'credit';
    amount: number;
}