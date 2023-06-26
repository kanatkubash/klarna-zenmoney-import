import Nordigen from ".";
import { DateTime } from "luxon";
import { Repository } from "typeorm";
import KeyValue from "../ZenMoney/KeyValue";

export default class Remember extends Nordigen {
  static BANK_ID = "ENTERCARD_SWEDNOKK";
  static PRODUCT_NAME = "RE:MEMBER";

  public async getAccountId() {
    await this.getToken();

    var account = (await this.getLocalKeyValues())[this.constructor.name];
    if (!account) {
      var requisitionId = await this.getRequisition(Remember.BANK_ID);
      var accounts = await this.listAccounts(requisitionId);
      var detailsPromise = accounts.map((accountId) =>
        this.getAccountDetails(accountId)
      );
      for await (var {
        account: { product },
        accountId,
      } of detailsPromise) {
        if (product.includes(Remember.PRODUCT_NAME)) {
          account = accountId;
          break;
        }
      }

      await this.saveLocalKeyValues({
        [this.constructor.name]: account,
      });
    }

    return account;
  }

  public async getTransactions(fromDate: Date, toDate?: Date) {
    await this.getToken();
    var accountId = await this.getAccountId();
    if (!accountId) return null;

    var fromDateAsStr = fromDate.toISOString().substring(0, 10);
    var toDateAsStr = (toDate ?? new Date()).toISOString();
    toDateAsStr = toDateAsStr.substring(0, 10);
    return this.getTransactionsInternal(accountId, fromDateAsStr, toDateAsStr);
  }
}
