import { OauthVariables, Replace } from "./../utils/BaseModel";
import fetch, { RequestInit } from "node-fetch";
import * as querystring from "node:querystring";
import { Repository } from "typeorm";
import KeyValue from "../ZenMoney/KeyValue";
import { DateTime } from "luxon";
import { createServer } from "http";
import open = require("open");
import * as net from "net";
import { ensureUuid, uuid } from "../utils/uuid";

interface TransactionInformation
  extends Omit<
    NordigenTransactionDetails,
    "valueDateTime" | "bookingDateTime" | "transactionAmount"
  > {
  transactionAmount: number;
  transactionCurrency: string;
  bookingDateTime: Date;
  valueDateTime: Date;
}
interface NordigenTransactionDetails {
  /**
   * 32 characters length unique Id
   */
  internalTransactionId: string;
  transactionId: string;
  transactionAmount: {
    currency: string;
    amount: string;
  };
  bankTransactionCode: string;
  bookingDateTime: string;
  valueDateTime: string;
  remittanceInformationUnstructured: string;
  remittanceInformationUnstructuredArray: string[];
  creditorName?: string;
}
interface Transactions {
  booked: NordigenTransactionDetails[];
  pending: NordigenTransactionDetails[];
}

export default class Nordigen {
  static GET_TOKEN_URL = "https://ob.nordigen.com/api/v2/token/new/";
  static REFRESH_TOKEN_URL = "https://ob.nordigen.com/api/v2/token/refresh/";
  static AGREEMENT_URL = "https://ob.nordigen.com/api/agreements/enduser/";
  static LINK_URL = "https://ob.nordigen.com/api/v2/requisitions/";
  static ACCOUNTS_URL = (requisitionId: string) =>
    `https://ob.nordigen.com/api/v2/requisitions/${requisitionId}`;
  static TRANSACTIONS_URL = (accountId: string, query: string = "") =>
    `https://ob.nordigen.com/api/v2/accounts/${accountId}/transactions/?${query}`;
  static ACCOUNT_DETAILS_URL = (accountId: string) =>
    `https://ob.nordigen.com/api/v2/accounts/${accountId}/details/`;
  static ACCOUNT_BALANCE_URL = (accountId: string) =>
    `https://ob.nordigen.com/api/v2/accounts/${accountId}/balances/`;
  static END_USER_ID = "nordigen-kk-1";
  static KEY_VALUE_TYPE = "Nordigen";

  private oauthVariables: OauthVariables;
  private secretId: string;
  private secretKey: string;
  private repository: Repository<KeyValue>;

  public constructor(
    secretId: string,
    secretKey: string,
    repository: Repository<KeyValue>
  ) {
    this.secretId = secretId;
    this.secretKey = secretKey;
    this.repository = repository;
    this.oauthVariables = {} as any;
  }

  protected async getToken() {
    if (!this.oauthVariables.access_token) {
      this.oauthVariables = await this.getTokens();
    }

    var isAccessTokenExpired = this.oauthVariables.access_expires
      ? DateTime.fromISO(this.oauthVariables.access_expires) < DateTime.now()
      : true;
    var isRefreshTokenExpired = this.oauthVariables.refresh_expires
      ? DateTime.fromISO(this.oauthVariables.refresh_expires) < DateTime.now()
      : true;

    if (isAccessTokenExpired || isRefreshTokenExpired) {
      var requestBody = isRefreshTokenExpired
        ? { secret_id: this.secretId, secret_key: this.secretKey }
        : { refresh: this.oauthVariables.refresh_token };
      var response = await this.sendRequest(
        isRefreshTokenExpired
          ? Nordigen.GET_TOKEN_URL
          : Nordigen.REFRESH_TOKEN_URL,
        requestBody,
        false
      );

      if (isAccessTokenExpired) {
        this.oauthVariables.access_token = response.access;
        this.oauthVariables.access_expires = DateTime.now()
          .plus({ seconds: parseInt(response.access_expires) })
          .toString();
      }
      if (isRefreshTokenExpired) {
        this.oauthVariables.refresh_token = response.refresh;
        this.oauthVariables.refresh_expires = DateTime.now()
          .plus({ seconds: parseInt(response.refresh_expires) })
          .toString();
      }

      await this.saveLocalKeyValues(this.oauthVariables);
    }
  }
  private async getTokens() {
    var { access_token, access_expires, refresh_token, refresh_expires } =
      await this.getLocalKeyValues();
    return {
      access_token,
      access_expires,
      refresh_token,
      refresh_expires,
    } as OauthVariables;
  }

  protected async getRequisition(bankId: string) {
    await this.getToken();

    var requisitionId = (await this.getLocalKeyValues())[bankId];

    if (!requisitionId) {
      var agreementId = await this.createAgreement(bankId);
      var { requisitionId, link, port } = await this.generateLinkAndRequisition(
        bankId,
        agreementId
      );
      await this.openLink(link, port);

      this.saveLocalKeyValues({ [bankId]: requisitionId });
    }

    return requisitionId;
  }

  private async createAgreement(bankId: string) {
    var requestBody = {
      max_historical_days: 360,
      enduser_id: Nordigen.END_USER_ID,
      aspsp_id: bankId,
    };
    await this.getToken();
    var { id: agreementId } = await this.sendRequest(
      Nordigen.AGREEMENT_URL,
      requestBody,
      true
    );

    return agreementId as string;
  }

  private async generateLinkAndRequisition(
    bankId: string,
    agreementId: string
  ) {
    var port = await this.getFreePort();
    var requestBody = {
      redirect: `http://localhost:${port}`,
      institution_id: bankId,
      reference: new Date().toISOString(),
      agreement: agreementId,
      user_language: "EN",
    };

    var { id: requisitionId, link }: { id: string; link: string } =
      await this.sendRequest(Nordigen.LINK_URL, requestBody, true);
    return { requisitionId, link, port };
  }

  private async openLink(link: string, port: number) {
    var server = createServer((req, res) => {});

    return new Promise(async (resolve) => {
      open(link);

      server.addListener("request", (request, response) => {
        response.write(link);
        response.end();
        resolve(request.url);
      });

      server.listen(port);
    }).finally(() => new Promise((resolve) => server.close(resolve)));
  }

  protected async getAccountDetails(accountId: string) {
    var details = await this.sendRequest(
      Nordigen.ACCOUNT_DETAILS_URL(accountId)
    );
    details.accountId = accountId;

    return details as {
      account: {
        details: string;
        displayName: string;
        name: string;
        ownerName: string;
        product: string;
        resourceId: string;
      };
      accountId: string;
    };
  }

  protected async listAccounts(requisitionId: string) {
    var { accounts } = await this.sendRequest(
      Nordigen.ACCOUNTS_URL(requisitionId)
    );

    return accounts as string[];
  }

  protected async getTransactionsInternal(
    accountId: string,
    dateFrom: string,
    dateTo: string
  ) {
    var requestBody = {
      date_from: dateFrom,
      date_to: dateTo,
    };
    var x = await this.sendRequest(
      Nordigen.TRANSACTIONS_URL(accountId, querystring.stringify(requestBody))
    );

    var { transactions } = (await this.sendRequest(
      Nordigen.TRANSACTIONS_URL(accountId, querystring.stringify(requestBody))
    )) as { transactions: Transactions };

    var [bookedConverted, pendingConverted] = [
      transactions.booked,
      transactions.pending,
    ].map((transactions) =>
      transactions.map(
        (transaction) =>
          ({
            ...transaction,
            bookingDateTime: DateTime.fromISO(
              transaction.bookingDateTime.replace(" ", "T") + "Z"
            ).toJSDate(),
            valueDateTime: DateTime.fromISO(
              transaction.valueDateTime.replace(" ", "T") + "Z"
            ).toJSDate(),
            transactionCurrency: transaction.transactionAmount.currency,
            transactionAmount: parseFloat(transaction.transactionAmount.amount),
          } as TransactionInformation)
      )
    );
    return { booked: bookedConverted, pending: pendingConverted };
  }

  async getLocalKeyValues() {
    var allKeyValues = await this.repository.find({
      where: { type: Nordigen.KEY_VALUE_TYPE },
    });

    return allKeyValues.reduce(
      (acc, { name, value }) => ((acc[name] = value), acc),
      {} as { [key: string]: string }
    );
  }

  async saveLocalKeyValues(keyValues: any) {
    var entries = Object.keys(keyValues).map(
      (key) =>
        new KeyValue({
          type: Nordigen.KEY_VALUE_TYPE,
          name: key,
          value: keyValues[key],
        })
    );

    await this.repository.save(entries);
  }

  private async sendRequest(
    url: string,
    requestBody?: object,
    needsToken: boolean = true
  ) {
    var headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };
    if (needsToken)
      headers["Authorization"] = `Bearer ${this.oauthVariables.access_token}`;

    var requestInit: RequestInit = { headers, method: "GET" };
    if (requestBody) {
      requestInit.body = JSON.stringify(requestBody);
      requestInit.method = "POST";
    }

    var response = await fetch(url, requestInit);

    return response.json();
  }

  private async getFreePort() {
    return new Promise<number>((resolve) => {
      const srv = net.createServer();
      srv.listen(0, () => {
        var port = (srv.address() as net.AddressInfo).port;
        srv.close(() => resolve(port));
      });
    });
  }
}
