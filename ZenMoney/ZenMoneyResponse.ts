import BaseModel from "../utils/BaseModel";
import Account from "./Account";
import Category from "./Category";
import Country from "./Country";
import Currency from "./Currency";
import Deletion from "./Deletion";
import Merchant from "./Merchant";
import Transaction from "./Transaction";
import User from "./User";

export interface ZenmoneyResponse {
  serverTimestamp: number;
  instrument: Currency[];
  country: Country[];
  user: User;
  account: Account[];
  tag: Category[];
  //   budget;
  merchant: Merchant[];
  //   reminder: Reminder[];
  //   reminderMarker: ReminderMarker[];
  transaction: Transaction[];
  deletion?: Deletion[];
}

export class ZenmoneyRequest {
  currentClientTimestamp: number;
  serverTimestamp: number;
  deletion?: ToDelete[];

  constructor(data: Partial<ZenmoneyRequest>) {
    Object.assign(this, data);
  }
}

export interface ToDelete {
  id: string;
  object:
    | "transaction"
    | "merchant"
    | "reminder"
    | "reminderMarker"
    | "budget"
    | "tag"
    | "account";
  user: number;
  stamp: number;
}
