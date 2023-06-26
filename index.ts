import "reflect-metadata";
import { ensureUuid } from "./utils/uuid";
import Transaction from "./ZenMoney/Transaction";
import { Connection, createConnection } from "typeorm";
import { Zenmoney } from "./ZenMoney";
import KeyValue from "./ZenMoney/KeyValue";
import Merchant from "./ZenMoney/Merchant";
import Category from "./ZenMoney/Category";
import Account from "./ZenMoney/Account";
import Reminder from "./ZenMoney/Reminder";
import ReminderMarker from "./ZenMoney/ReminderMarker";
import User from "./ZenMoney/User";
import Country from "./ZenMoney/Country";
import Company from "./ZenMoney/Company";
import Remember from "./Nordigen/Remember";
import { DateTime } from "luxon";
import Currency from "./ZenMoney/Currency";
import Klarna from "./Klarna";
import KlarnaTransaction from "./Klarna/KlarnaTransaction";
import { processKaspi } from "./kaspi";
import { notify } from "node-notifier";

const sync = async (
  connection: Connection,
  client: Zenmoney,
  downloadOnly: boolean,
  serverTimestamp?: number
) => {
  var {
    instrument,
    transaction,
    merchant,
    tag: category,
    account,
    reminder,
    reminderMarker,
    user,
    country,
    company,
    deletion,
  } = await client.processDiffs(connection, downloadOnly, serverTimestamp);

  await connection
    .getRepository(Currency)
    .save((instrument ?? []).map((c) => new Currency(c)));
  await connection
    .getRepository(Country)
    .save((country ?? []).map((u) => new Country(u)));
  await connection
    .getRepository(Company)
    .save((company ?? []).map((u) => new Company(u)));
  await connection
    .getRepository(User)
    .save((user ?? []).map((u) => new User(u)));
  await connection
    .getRepository(Category)
    .save((category ?? []).map((t) => new Category(t)));
  await connection
    .getRepository(Merchant)
    .save((merchant ?? []).map((t) => new Merchant(t)));
  await connection
    .getRepository(Account)
    .save((account ?? []).map((t) => new Account(t)));
  await connection
    .getRepository(Transaction)
    .save(
      (transaction ?? [])
        .map((t) => new Transaction(t))
        .filter((t) => t.date >= new Date("2023-02-22T00:00:00Z"))
    );
  await connection
    .getRepository(Reminder)
    .save((reminder ?? []).map((t) => new Reminder(t)));
  await connection
    .getRepository(ReminderMarker)
    .save((reminderMarker ?? []).map((t) => new ReminderMarker(t)));

  console.log(deletion);
  notify((deletion?.length ?? 0) + " deletions");
};

(async () => {
  var connection = await createConnection();
  var client = new Zenmoney(
    {
      consumerKey: process.env.ZENMONEY_CONSUMER_KEY!,
      consumerSecret: process.env.ZENMONEY_CONSUMER_SECRET!,
      username: process.env.ZENMONEY_USERNAME!,
      password: process.env.ZENMONEY_PASSWORD!,
      urlRedirect: process.env.ZENMONEY_URLREDIRECT!,
      debug: true,
    },
    await connection.getRepository(KeyValue)
  );
  var timestamp = await connection
    .getRepository(KeyValue)
    .findOneByOrFail({ type: Zenmoney.name, name: "serverTimestamp" });
  await sync(connection, client, false);
  var lastSyncDate = DateTime.fromSeconds(+timestamp.value).toJSDate();
  var rememeber = new Remember(
    process.env.NORDIGEN_SECRET_ID as string,
    process.env.NORDIGEN_SECRET_KEY as string,
    connection.getRepository(KeyValue)
  );
  var rememberTransactions = await rememeber.getTransactions(lastSyncDate);
  if (!rememberTransactions) return;
  var today = DateTime.now().toJSDate();
  var remeberAccount = await connection
    .getRepository(Account)
    .findOneOrFail({ where: { syncID: await rememeber.getAccountId() } });
  var transactionsToSave = rememberTransactions.booked.map((transaction) => {
    var zenTransaction = new Transaction({
      id: ensureUuid(transaction.internalTransactionId),
      created: today,
      changed: today,
      date: transaction.bookingDateTime ?? transaction.valueDateTime,
      user: remeberAccount.user,
      originalPayee: transaction.creditorName,
      payee: transaction.creditorName,
      comment: transaction.remittanceInformationUnstructuredArray.join(" "),
    });
    zenTransaction.incomeInstrument = zenTransaction.outcomeInstrument =
      remeberAccount.instrument;
    zenTransaction.incomeAccount = zenTransaction.outcomeAccount =
      remeberAccount.id;
    if (transaction.transactionAmount > 0) {
      zenTransaction.outcome = 0;
      zenTransaction.income = transaction.transactionAmount;
    } else {
      zenTransaction.income = 0;
      zenTransaction.outcome = Math.abs(transaction.transactionAmount);
    }

    return zenTransaction;
  });
  await connection.getRepository(Transaction).save(transactionsToSave);
  //   //   return;
  //   var klarna = new Klarna(process.env.KLARNA_TOKEN!);
  //   var tr = await klarna.getTransactions(new Date("2023-02-22T00:00:00Z"));
  //   await connection.getRepository(KlarnaTransaction).save(tr);
  //   return;

  //   await processKaspi(connection, client);
  //   return;

  //   var krn = await connection
  //     .getRepository(KlarnaTransaction)
  //     .find({ take: 10 });
  //   var x = await client.getSuggestion(
  //     krn.map(
  //       (k) =>
  //         new Transaction({
  //           payee: k.brand,
  //           opOutcome: k.totalAmount,
  //           outcome: k.originalTotalAmount,
  //         })
  //     )
  //   );
  //   var account = await connection
  //     .getRepository(Account)
  //     .findOneByOrFail({ id: "431876f2-ed02-46c2-b2ac-6820753c0a8e" });
  //   account.balance = 65962.34;
  //   account.changed = new Date();
  //   await connection.getRepository(Account).save(account);
  //   console.log(x);
  //   return;
  await sync(connection, client, true, +timestamp.value);
})();
