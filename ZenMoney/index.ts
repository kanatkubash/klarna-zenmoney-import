import { ZenmoneyRequest, ZenmoneyResponse } from "./ZenMoneyResponse";
import fetch, { RequestInfo, RequestInit } from "node-fetch";
import { writeFile } from "fs/promises";
import { URL, URLSearchParams } from "url";
import { EntityTarget, Repository, ObjectLiteral, MoreThan } from "typeorm";
import KeyValue from "./KeyValue";
import Transaction from "./Transaction";
import Account from "./Account";
import BaseModel, { OauthVariables } from "../utils/BaseModel";

export interface IRepositoryProvider {
  getRepository<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>
  ): Repository<Entity>;
}

export class Zenmoney {
  static AUTH_URL = "https://api.zenmoney.ru/oauth2/authorize/";
  static TOKEN_URL = "https://api.zenmoney.ru/oauth2/token";
  static DIFF_URL = "https://api.zenmoney.ru/v8/diff/";
  static SUGGEST_URL = "https://api.zenmoney.ru/v8/suggest/";
  static KEY_VALUE_TYPE = Zenmoney.name;

  private params: {
    consumerKey: string;
    consumerSecret: string;
    username: string;
    password: string;
    urlRedirect: string;
    debug?: boolean;
  };
  private repository: Repository<KeyValue>;
  private oauthVariables!: OauthVariables;

  constructor(
    params: {
      consumerKey: string;
      consumerSecret: string;
      username: string;
      password: string;
      urlRedirect: string;
      debug?: boolean;
    },
    repository: Repository<KeyValue>
  ) {
    this.params = params;
    this.repository = repository;
  }

  private async sendRequest(url: RequestInfo, params?: RequestInit) {
    var response = await fetch(url, params);
    if (this.params.debug) {
      var urlPath = (
        url instanceof URL ? url : new URL(url.toString())
      ).pathname
        .substr(1)
        .replace(/\//g, ".");
      let content = await response.text();
      var isJson = content.startsWith("{");
      var ext = isJson ? "json" : "log";
      writeFile(`logs/${urlPath}.${ext}`, content);
      response.json = () => JSON.parse(content);
    }
    return response;
  }

  async getToken() {
    if (
      this.oauthVariables ||
      (this.oauthVariables = await this.getLocalToken())
    )
      return this.oauthVariables;

    var url = new URL(Zenmoney.AUTH_URL);
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: this.params.consumerKey,
      redirect_uri: this.params.urlRedirect,
    }).toString();

    var response = await this.sendRequest(url);
    var [cookie] = response.headers.get("set-cookie")!.split(";");

    var params = new URLSearchParams({
      username: this.params.username,
      password: this.params.password,
      auth_type_password: "Sign in",
    });
    var response = await this.sendRequest(url, {
      //   agent: new HttpsProxyAgent("https://127.0.0.1:9999"),
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
      redirect: "manual",
    });
    var headers = response.headers;
    // console.log(await response.text());
    var authorizeCode = new URL(headers.get("Location")!).searchParams.get(
      "code"
    )!;
    var params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.params.consumerKey,
      client_secret: this.params.consumerSecret,
      code: authorizeCode,
      redirect_uri: this.params.urlRedirect,
    });
    var response = await this.sendRequest(Zenmoney.TOKEN_URL, {
      body: params,
      method: "POST",
    });

    this.oauthVariables = await response.json();
    await this.saveTokenLocally();

    return this.oauthVariables;
  }

  async processDiffs(
    repositoryProvider: IRepositoryProvider,
    downloadOnly: boolean,
    serverTimestamp?: number
  ) {
    // return require("../logs/v8.diff..json") as ZenmoneyResponse;
    serverTimestamp = await this.noramlizeTimestamp(serverTimestamp);
    await this.getToken();

    var newTransactions = downloadOnly
      ? void 0
      : await repositoryProvider.getRepository(Transaction).findBy({
          changed: MoreThan(new Date(serverTimestamp * 1000)),
        });
    var newAccounts = downloadOnly
      ? void 0
      : await repositoryProvider
          .getRepository(Account)
          .findBy({ changed: MoreThan(new Date(serverTimestamp * 1000)) });

    var zenmoneyResponse = await this.makeDiffRequest(
      serverTimestamp,
      newTransactions,
      newAccounts
    );
    await this.updateServerTimestamp(zenmoneyResponse.serverTimestamp);

    return zenmoneyResponse;
  }

  async getSuggestion(transaction: Partial<Transaction>[]) {
    await this.getToken();

    var response = await this.sendRequest(Zenmoney.SUGGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.oauthVariables.access_token}`,
      },
      body: JSON.stringify(transaction),
    });

    return response.json() as Promise<Partial<Transaction>[]>;
  }

  async noramlizeTimestamp(serverTimestamp?: number): Promise<number> {
    return serverTimestamp == void 0
      ? await this.repository
          .findOneBy({
            type: Zenmoney.KEY_VALUE_TYPE,
            name: "serverTimestamp",
          })
          .then((t) => parseInt(t?.value || "0"))
      : serverTimestamp;
  }

  async updateServerTimestamp(serverTimestamp: number) {
    return this.repository.upsert(
      new KeyValue({
        type: Zenmoney.KEY_VALUE_TYPE,
        name: "serverTimestamp",
        value: serverTimestamp.toString(),
      }),
      ["type", "name"]
    );
  }

  async makeDiffRequest(
    serverTimestamp: number,
    transactions?: Transaction[],
    accounts?: Account[]
  ) {
    var response = await this.sendRequest(Zenmoney.DIFF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.oauthVariables.access_token}`,
      },
      body: JSON.stringify(
        new ZenmoneyRequest({
          serverTimestamp,
          //@ts-expect-error
          transaction: transactions?.map((tr) => ({
            ...tr,
            created: Math.floor(tr.created.getTime() / 1000),
            changed: Math.floor(tr.changed.getTime() / 1000),
          })),
          //@ts-expect-error
          account: accounts?.map((ac) => ({
            ...ac,
            changed: ac.changed.getTime() / 1000,
          })),
          //   forceFetch: ["instrument"],
          currentClientTimestamp: Math.floor(new Date().getTime() / 1000),
        })
      ),
    });

    console.log(
      JSON.stringify(
        new ZenmoneyRequest({
          serverTimestamp,
          transaction: transactions,
          account: accounts,
          //   forceFetch: ["company", "country"],
          currentClientTimestamp: Math.floor(new Date().getTime() / 1000),
        })
      )
    );
    if (response.status != 200)
      throw new Error(JSON.stringify(await response.json()));

    var zenmoneyResponse: ZenmoneyResponse = await response.json();
    return zenmoneyResponse;
  }

  async getLocalToken() {
    var allKeyValues = await this.repository.find({
      where: { type: Zenmoney.KEY_VALUE_TYPE },
    });
    return allKeyValues.reduce(
      (acc, { name, value }) => ((acc[name] = value), acc),
      {} as any
    ) as OauthVariables;
  }

  async saveTokenLocally() {
    var entries = Object.keys(this.oauthVariables).map(
      (key) =>
        new KeyValue({
          type: Zenmoney.KEY_VALUE_TYPE,
          name: key,
          value: this.oauthVariables[key as keyof OauthVariables],
        })
    );

    await this.repository.save(entries);
  }
}
