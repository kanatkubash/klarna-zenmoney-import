import { Transaction } from "./Models";

export interface TransactionResponse {
  data: {
    enrichedTransactionList: {
      page: Transaction[];
      paginationToken: number;
    };
  };
}
