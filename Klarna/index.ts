import fetch from "node-fetch";
import { TransactionResponse } from "./TransactionResponse";
import { readFileSync } from "fs";
import { Transaction } from "./Models";

class Klarna {
  static URL = "https://app.klarna.com/se/api/orders_bff/transactions/graphql";
  private token: string;
  private queries: { [key: string]: string } = {};

  constructor(token: string) {
    this.token = token;
  }

  public async getTransactions(count: number) {
    var allTransactions: Transaction[] = [];
    while (count == 0 || allTransactions.length < count) {
      var transactions = await this.getTransaction(allTransactions.length);
      allTransactions.push(...transactions);
      if (transactions.length == 0) break;
    }

    return allTransactions;
  }

  private async getTransaction(startingFrom: number): Promise<Transaction[]> {
    var result = await fetch(Klarna.URL, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        query:
          this.queries["getTransaction"] ||
          (this.queries["getTransaction"] = readFileSync("./request.graphql", {
            encoding: "utf8",
          })),
        variables: {
          page: {
            limit: 10,
            token: startingFrom,
          },
          filter: "internal",
          filterData: {},
        },
      }),
    });
    var response: TransactionResponse = await result.json();
    var {
      enrichedTransactionList: { page },
    } = response.data;

    return page;
  }
}

export default Klarna;
