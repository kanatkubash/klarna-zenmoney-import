import { BeforeInsert, Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class Transaction extends BaseModel<Transaction> {
  @PrimaryColumn()
  id!: string;
  @Column({ type: "datetime" })
  changed!: Date;
  @Column({ nullable: true })
  comment?: string;
  @Column({ type: "datetime" })
  created!: Date;
  @Column({ type: "date" })
  date!: Date;
  @Column()
  deleted: boolean;
  @Column({ nullable: true })
  hold?: boolean; //clarify
  @Column()
  income!: number;
  @Column()
  incomeAccount!: string;
  @Column({ nullable: true })
  incomeBankID?: string;
  @Column()
  incomeInstrument!: number;
  latitude = null;
  longitude = null;
  @Column({ nullable: true })
  merchant!: string;
  @Column({ nullable: true })
  opIncome?: number;
  @Column({ nullable: true })
  opIncomeInstrument?: number;
  @Column({ nullable: true })
  opOutcome?: number;
  @Column({ nullable: true })
  opOutcomeInstrument?: number;
  @Column({ nullable: true })
  payee?: string;
  @Column({ nullable: true })
  originalPayee?: string;
  @Column()
  outcome!: number;
  @Column()
  outcomeAccount!: string;
  @Column({ nullable: true })
  outcomeBankID?: string;
  @Column()
  outcomeInstrument!: number;
  @Column({ nullable: true })
  qrCode?: string;
  @Column({ nullable: true })
  reminderMarker?: string;
  @Column({ nullable: true })
  source?: string;
  @Column({ nullable: true, type: "simple-array" })
  tag?: string[];
  @Column()
  user!: number;
  @Column()
  viewed: boolean;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    Transaction,
    Date
  >[] = ["changed", "created"];

  protected static dateFieldsToBeFixed: ExtractPropertyNamesOfType<
    Transaction,
    Date
  >[] = ["date"];

  constructor(params: Partial<Transaction> = {}) {
    super(params);
    this.deleted = false;
    this.viewed = false;
  }
}
