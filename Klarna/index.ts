import { DateTime } from "luxon";
import fetch, { RequestInit } from "node-fetch";
import { readFileSync } from "fs";
import {
  ExchangeInformation,
  KlarnaCategoryResponse,
  TransactionResponse,
  TransactionDetailsResponse,
  TransactionResponseItem,
  TransactionItem,
  PaymentInformation,
} from "./Models";
import path = require("path");
import KlarnaTransaction from "./KlarnaTransaction";

class Klarna {
  static URL = "https://app.klarna.com/se/api/orders_bff/transactions/graphql";
  static TRANSACTION_DETAILS_URL = (transactionId: string) =>
    `https://app.klarna.com/se/api/orders_bff/v1/transactions/internal/${transactionId}`;
  static CATEGORY_URL =
    "https://app.klarna.com/se/api/pf_bff/graphql/?name=PfTransactionCategory";
  private token: string;
  private queries: { [key: string]: string } = {};

  constructor(token: string) {
    this.token = token;
    var tokenContents = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    if (new Date(+tokenContents.exp * 1000) < new Date())
      throw new Error("Token has expired");
  }

  public async getTransactions(until: Date) {
    var allTransactions: KlarnaTransaction[] = [];
    while (true) {
      var transactionsResponse = await this.getTransaction(
        allTransactions.length
      );

      if (transactionsResponse.length == 0) break;

      var transactions = await Promise.all(
        transactionsResponse.map(async (tr, index) => {
          let localTransaction = tr;
          let transactionDetailsPromise = this.getTransactionDetails(
            tr.transactionKrn
          );
          let categoryPromise = this.getTransactionCategory(tr.transactionKrn);

          var [transactionDetails, category] = await Promise.all([
            transactionDetailsPromise,
            categoryPromise,
          ]);

          return KlarnaTransaction.createFromResponseTransaction(
            localTransaction,
            category,
            transactionDetails?.paymentMethodInformation,
            transactionDetails?.exchangeInformation
          );
        })
      );

      transactions.forEach((transaction) => {
        var duplicate = allTransactions.find(
          (at) => at.transactionKrn === transaction.transactionKrn
        );
        if (
          duplicate &&
          JSON.stringify(duplicate) != JSON.stringify(transaction)
        ) {
          debugger;
        } else if (!duplicate) allTransactions.push(transaction);
      });

      if (
        transactionsResponse.find(
          (t) =>
            DateTime.fromISO(
              (t.rootCreatedAt ?? t.createdAt) as unknown as string
            ).toJSDate() < until
        )
      )
        break;
    }

    return allTransactions;
  }

  private async getTransactionDetails(krnTransactionId: string) {
    var length = "krn:ccs:transaction:".length;
    var url = Klarna.TRANSACTION_DETAILS_URL(
      krnTransactionId.substring(length)
    );
    var result = (await this.sendRequest(url)) as TransactionDetailsResponse;
    var exchangeInformation = result.traits.find((t) =>
      isExchangeInformation(t)
    ) as ExchangeInformation;
    var paymentMethodInformation = result.traits.find((t) =>
      isPaymentInformation(t)
    ) as PaymentInformation;

    if (exchangeInformation == null) return null;

    return { exchangeInformation, paymentMethodInformation };
  }

  private async getTransactionCategory(krnTransactionId: string) {
    var requestBody = {
      operationName: "PfTransactionCategory",
      variables: {
        transactionId: {
          internal: {
            krn: krnTransactionId,
          },
        },
      },
      query: readFileSync(path.join(__dirname, "./categoryQuery.graphql"), {
        encoding: "utf8",
      }),
    };

    var response = (await this.sendRequest(
      Klarna.CATEGORY_URL,
      requestBody
    )) as KlarnaCategoryResponse;

    return response.data.transaction.subCategoryKey;
  }

  private async getTransaction(startingFrom: number) {
    var result = await fetch(Klarna.URL, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        query:
          this.queries["getTransaction"] ||
          (this.queries["getTransaction"] = readFileSync(
            path.join(__dirname, "./request.graphql"),
            {
              encoding: "utf8",
            }
          )),
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
    console.warn(JSON.stringify(response));
    var {
      enrichedTransactionList: { page },
    } = response.data;

    return page;
  }

  private async sendRequest(url: string, requestBody?: object) {
    var headers: { [key: string]: string } = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      "x-klarna-app-platform": "web",
    };

    var requestInit: RequestInit = { headers, method: "GET" };
    if (requestBody) {
      requestInit.body = JSON.stringify(requestBody);
      requestInit.method = "POST";
    }

    var response = await fetch(url, requestInit);

    return response.json();
  }
}

const isExchangeInformation = (object: any): object is ExchangeInformation =>
  object.type == "exchangeAmount";
const isPaymentInformation = (object: any): object is PaymentInformation =>
  object.type == "paymentMethod";

export default Klarna;
