import { newUuid } from "./utils/uuid";
import { Zenmoney } from "./ZenMoney/index";
import { Connection, createConnection, MoreThanOrEqual } from "typeorm";
import { readFileSync } from "fs";
import { DateTime } from "luxon";
import Transaction from "./ZenMoney/Transaction";
import path = require("path");
import { keyBy, minBy, pick } from "lodash";
import Account from "./ZenMoney/Account";

const KASPI_ACCOUNT = "Kaspi";
enum KaspiOperation {
  RECEIVE = "Пополнение",
  SPEND = "Покупка",
  TRANSFER = "Перевод",
  WITHDRAW = "Снятие",
}
export type KaspiTransaction = {
  date: Date;
  amount: number;
  type: KaspiOperation;
  comment: string;
};

export const getTransactionsFromFile = (file: string) => {
  var contents = readFileSync(file, { encoding: "utf-8" });
  var lines = contents
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  var transactions = new Array<KaspiTransaction>();
  for (var line of lines) {
    var match: RegExpMatchArray | null;
    if (
      (match = line.match(
        /(?<date>(?:\d{2}.){2}\d{2}) (?<numberWithSpaces>[+-][\d ]+),00 . (?<type>\p{L}+) (?<comment>.*)/u
      ))
    ) {
      var date = DateTime.fromFormat(match.groups!.date, "dd.MM.yy").toJSDate();
      var amount = Math.abs(
        parseInt(match.groups!.numberWithSpaces.replaceAll(" ", ""))
      );
      var type: KaspiOperation = match.groups!.type as KaspiOperation;
      var comment = match.groups!.comment;

      transactions.push({ date, amount, type, comment });
    }
  }
  return transactions;
};

export const processKaspi = async (
  connection: Connection,
  zenmoneyClient: Zenmoney
) => {
  var transactions = getTransactionsFromFile(path.join(__dirname, "kaspi.txt"));
  if (transactions.length == 0)
    throw new Error("Empty transactions from Kaspi");

  transactions = await filterDuplicates(connection, transactions);
  if (transactions.length == 0)
    console.log("No unique transactions found. Exiting Kaspi");

  debugger;
  await saveTransactions(connection, zenmoneyClient, transactions);
};

const saveTransactions = async (
  connection: Connection,
  zenmoneyClient: Zenmoney,
  transactions: KaspiTransaction[]
) => {
  var today = DateTime.now().toJSDate();
  var kaspiAccount = await connection
    .getRepository(Account)
    .findOneByOrFail({ title: KASPI_ACCOUNT });

  var zenmoneyTransactions = transactions.map((tr) => {
    return new Transaction({
      id: newUuid(),
      created: today,
      changed: today,
      date: tr.date,
      income: tr.type == KaspiOperation.RECEIVE ? tr.amount : 0,
      incomeAccount: kaspiAccount.id,
      incomeInstrument: kaspiAccount.instrument,
      outcome: tr.type == KaspiOperation.RECEIVE ? 0 : tr.amount,
      outcomeAccount: kaspiAccount.id,
      outcomeInstrument: kaspiAccount.instrument,
      user: kaspiAccount.user,
      originalPayee: tr.comment,
      payee: tr.comment,
    });
  });

  var suggestionParams = zenmoneyTransactions.map(
    ({
      id,
      income,
      outcome,
      outcomeAccount,
      incomeAccount,
      incomeInstrument,
      outcomeInstrument,
      payee,
    }) => ({
      id,
      income,
      outcome,
      outcomeAccount,
      incomeAccount,
      incomeInstrument,
      outcomeInstrument,
      payee,
    })
  );
  var suggested = await zenmoneyClient.getSuggestion(suggestionParams);
  var suggestedById = keyBy(suggested, "id");
  zenmoneyTransactions.forEach((t) => {
    var suggestion = suggestedById[t.id];
    if (suggestion.payee == "С") delete suggestion.payee;
    Object.assign(t, suggestion);
    console.log(t.id);
  });

  await connection.getRepository(Transaction).save(zenmoneyTransactions);
};

const filterDuplicates = async (
  connection: Connection,
  transactions: KaspiTransaction[]
) => {
  var minimumDate = minBy(transactions, "date")?.date!;

  var existingTransactions = await connection
    .getRepository(Transaction)
    .findBy({ date: MoreThanOrEqual(minimumDate), deleted: false });

  var uniqueTransactions = transactions.filter(
    (tr) =>
      existingTransactions.find((et) => isTransactionEqual(tr, et)) === void 0
  );

  return uniqueTransactions;
};

const isTransactionEqual = (
  kaspiTransaction: KaspiTransaction,
  dbKaspiTransaction: Transaction
) => {
  if (
    kaspiTransaction.comment != dbKaspiTransaction.originalPayee ||
    kaspiTransaction.date == dbKaspiTransaction.date
  )
    return false;

  switch (kaspiTransaction.type) {
    case KaspiOperation.RECEIVE:
      return kaspiTransaction.amount == dbKaspiTransaction.income;
    case KaspiOperation.SPEND:
    case KaspiOperation.TRANSFER:
      return Math.abs(kaspiTransaction.amount) == dbKaspiTransaction.outcome;
    case KaspiOperation.WITHDRAW:
      throw new Error("Not implemented");
      return Math.abs(kaspiTransaction.amount) == dbKaspiTransaction.outcome;
  }
};
