export enum Currencies {
  SEK = "SEK",
  USD = "USD",
  EUR = "EUR",
  RUB = "RUB",
  KZT = "KZT",
}

export interface Amount {
  amount: number;
  currency: string;
}

export interface TransactionStatusParams {
  numberOfDays: number;
  dueDate: string;
  date: string;
}

export interface TransactionStatus {
  name: string;
  params: TransactionStatusParams;
}
export interface TransactionItemResponse {
  name: string;
  quantity: number;
  totalAmount: Amount;
  images: { format: string; url: string }[];
}
export interface TransactionItem
  extends Omit<TransactionItemResponse, "images"> {
  image: string;
}

export interface TransactionResponseItem {
  uniqueId: string;
  transactionKrn: string;
  createdAt: string;
  rootCreatedAt: string | null;
  merchantOrderReference: string;
  amountPaid: Amount;
  brand: {
    displayName: string;
  };
  status: TransactionStatus;
  lineItems: TransactionItemResponse[];
  shipping: Amount;
  individualFees: any[];
  interestFee: any[];
  totalAmount: Amount;
}

export interface TransactionResponse {
  data: {
    enrichedTransactionList: {
      page: TransactionResponseItem[];
      paginationToken: number;
    };
  };
}

export interface ExchangeInformation {
  amountInOriginalCurrency: Amount;
  type: "exchangeAmount";
}
export interface PaymentInformation {
  bucketId: string;
  name: string;
  type: "paymentMethod";
}

export interface TransactionDetailsResponse {
  traits: (ExchangeInformation | object)[];
}

export interface KlarnaCategoryResponse {
  data: {
    transaction: {
      id: string;
      categoryKey: string;
      subCategoryKey: string;
    };
  };
}
