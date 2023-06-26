import BaseModel from "../utils/BaseModel";
import Account from "./Account";
import Category from "./Category";
import Company from "./Company";
import Country from "./Country";
import Currency from "./Currency";
import Deletion from "./Deletion";
import Merchant from "./Merchant";
import Reminder from "./Reminder";
import ReminderMarker from "./ReminderMarker";
import Transaction from "./Transaction";
import User from "./User";

type Entities =
  | "instrument"
  | "transaction"
  | "merchant"
  | "reminder"
  | "reminderMarker"
  | "budget"
  | "tag"
  | "account"
  | "company"
  | "country";
export interface ZenmoneyResponse {
  serverTimestamp: number;
  instrument: Currency[];
  country: Country[];
  company: Company[];
  user: User[];
  account: Account[];
  tag: Category[];
  //   budget;
  merchant: Merchant[];
  reminder: Reminder[];
  reminderMarker: ReminderMarker[];
  transaction: Transaction[];
  deletion?: Deletion[];
}

export class ZenmoneyRequest {
  currentClientTimestamp!: number;
  serverTimestamp!: number;
  deletion?: ToDelete[];
  tag?: Category[];
  merchant?: Merchant[];
  transaction?: Transaction[];
  account?: Account[];
  forceFetch?: Entities[];

  constructor(data: Partial<ZenmoneyRequest>) {
    Object.assign(this, data);
  }
}

export interface ToDelete {
  id: string;
  object: Entities;
  user: number;
  stamp: number;
}
