export enum Currencies {
  SEK = "SEK",
  USD = "USD",
  EUR = "EUR",
  RUB = "RUB",
  KZT = "KZT",
}

export interface Amount {
  amount: number;
  currency: Currencies;
}

export interface TransactionStatusParams {
  numberOfDays: number;
  dueDate: Date;
  date: Date;
}

export interface TransactionStatus {
  __typename: string;
  name: string;
  params: TransactionStatusParams;
}
export interface TransactionItem {
  __typename: string;
  name: string;
  quantity: number;
  totalAmount: Amount;
}

export interface Transaction {
  transactionKrn: string;
  createdAt: Date;
  merchantOrderReference: string;
  amountPaid: Amount;
  brand: {
    displayName: string;
  };
  status: TransactionStatus;
  lineItems: TransactionItem[];
  individualFees: any[];
  interestFee: any[];
  totalAmount: Amount;
}
