import { Transaction } from "./Transaction";

export interface TransactionResponse {
  enrichedTransactionList: {
    page: Transaction[];
    paginationToken: number;
  };
}
