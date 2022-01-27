import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class Account extends BaseModel<Account> {
  @PrimaryColumn()
  id: string; // UUID
  @Column({ type: "datetime" })
  changed: Date;
  user: number;
  @Column({ nullable: true })
  role: number;
  @Column({ nullable: true })
  instrument?: number;
  @Column({ nullable: true })
  company: number;
  @Column()
  type: "cash" | "ccard" | "checking" | "loan" | "deposit" | "emoney" | "debt";
  @Column()
  title: string;
  @Column({ nullable: true, type: "simple-array" })
  syncID?: string[];
  @Column({ nullable: true })
  balance?: number;
  @Column({ nullable: true })
  startBalance?: number;
  @Column({ nullable: true })
  creditLimit?: number;
  @Column()
  inBalance: boolean;
  @Column({ nullable: true })
  savings?: boolean;
  @Column()
  enableCorrection: boolean;
  @Column()
  enableSMS: boolean;
  @Column()
  archive: boolean;

  @Column({ nullable: true })
  /**
   * для депозита - есть ли капитализация процентов. Для кредита - является ли кредит аннуитетным.
   */
  capitalization?: boolean;
  @Column({ nullable: true })
  percent?: number;
  @Column({ type: "date", nullable: true })
  startDate?: Date;
  @Column({ nullable: true })
  endDateOffset?: number;
  @Column({ nullable: true })
  endDateOffsetInterval?: "day" | "week" | "month" | "year";
  @Column({ nullable: true })
  payoffStep?: number;
  @Column({ nullable: true })
  payoffInterval?: "month" | "year";

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    Account,
    Date
  >[] = ["changed"];
  protected static dateFieldsToBeFixed: ExtractPropertyNamesOfType<
    Account,
    Date
  >[] = ["startDate"];
}
