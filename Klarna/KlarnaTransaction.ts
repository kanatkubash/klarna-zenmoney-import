import {
  Column,
  Entity,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";
import {
  Amount,
  TransactionItem,
  TransactionStatus,
  TransactionResponseItem,
  ExchangeInformation,
  PaymentInformation,
} from "./Models";

@Entity()
export default class KlarnaTransaction
  extends BaseModel<KlarnaTransaction>
  implements
    Omit<
      TransactionResponseItem,
      | "totalAmount"
      | "brand"
      | "shipping"
      | "individualFees"
      | "interestFee"
      | "lineItems"
      | "createdAt"
      | "rootCreatedAt"
    >
{
  @PrimaryColumn()
  transactionKrn: string;

  @Column({ nullable: true })
  uniqueId: string;

  @Column("datetime")
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  merchantOrderReference: string;

  @Column()
  totalAmount: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  originalTotalAmount?: number;

  @Column({ nullable: true })
  originalCurrency: string;

  @Column({ type: "simple-json" })
  amountPaid: Amount;

  @Column()
  brand: string;

  @Column({ type: "simple-json" })
  status: TransactionStatus;

  @Column({ type: "simple-json" })
  lineItems: TransactionItem[];

  @Column()
  category: string;

  @Column({ type: "simple-json", nullable: true })
  paymentMethod?: PaymentInformation;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    KlarnaTransaction,
    Date
  >[] = ["createdAt"];

  static createFromResponseTransaction(
    responseItem: TransactionResponseItem,
    category: string,
    paymentInformation?: PaymentInformation,
    originalCurrency?: ExchangeInformation
  ) {
    var { totalAmount, brand, lineItems, rootCreatedAt, createdAt, ...rest } =
      responseItem;
    var klarnaTransaction = new KlarnaTransaction(rest);
    klarnaTransaction.totalAmount = totalAmount.amount / -100;
    klarnaTransaction.currency = totalAmount.currency;
    klarnaTransaction.brand = brand.displayName;
    klarnaTransaction.createdAt = new Date(rootCreatedAt ?? createdAt);

    klarnaTransaction.lineItems = lineItems.map(
      ({ images, totalAmount, ...rest }) => {
        totalAmount.amount /= 100;
        var squareImage = images.find((image) => image.format == "SQUARE")?.url;
        return {
          ...rest,
          totalAmount,
          image: squareImage,
        } as TransactionItem;
      }
    );

    if (originalCurrency) {
      klarnaTransaction.originalCurrency =
        originalCurrency.amountInOriginalCurrency.currency;
      klarnaTransaction.originalTotalAmount =
        originalCurrency.amountInOriginalCurrency.amount / 100;
    }

    klarnaTransaction.category = category;
    klarnaTransaction.paymentMethod = paymentInformation;

    return klarnaTransaction;
  }
}
