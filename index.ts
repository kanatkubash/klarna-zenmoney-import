import "reflect-metadata";

import Transaction from "./ZenMoney/Transaction";
import { createConnection } from "typeorm";
import { Zenmoney } from "./ZenMoney";
import KeyValue from "./ZenMoney/KeyValue";
import Merchant from "./ZenMoney/Merchant";
import Category from "./ZenMoney/Category";
import Account from "./ZenMoney/Account";

(async () => {
  var connection = await createConnection();
  var client = new Zenmoney(
    {
      consumerKey: process.env.ZENMONEY_CONSUMER_KEY,
      consumerSecret: process.env.ZENMONEY_CONSUMER_SECRET,
      username: process.env.ZENMONEY_USERNAME,
      password: process.env.ZENMONEY_PASSWORD,
      urlRedirect: process.env.ZENMONEY_URLREDIRECT,
      debug: true,
    },
    await connection.getRepository(KeyValue)
  );
  var {
    transaction,
    merchant,
    tag: category,
    account,
  } = await client.processDiffs();

  await connection
    .getRepository(Merchant)
    .save((merchant ?? []).map((t) => new Merchant(t)));
  await connection
    .getRepository(Transaction)
    .save((transaction ?? []).map((t) => new Transaction(t)));
  await connection
    .getRepository(Category)
    .save((category ?? []).map((t) => new Category(t)));
  await connection
    .getRepository(Account)
    .save((account ?? []).map((t) => new Account(t)));
})();
