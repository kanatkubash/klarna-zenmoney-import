import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class Reminder extends BaseModel<Reminder> {
  @PrimaryColumn()
  id!: string;
  @Column({ type: "datetime" })
  changed!: Date;
  @Column()
  user!: number;
  @Column()
  income!: number;

  @Column()
  incomeAccount!: string;
  @Column()
  incomeInstrument!: number;
  @Column()
  outcome!: number;
  @Column()
  outcomeAccount!: string;
  @Column()
  outcomeInstrument!: number;
  @Column({ nullable: true, type: "simple-array" })
  tag?: string[];

  @Column({ nullable: true })
  merchant!: string;
  @Column({ nullable: true })
  payee?: string;
  @Column({ nullable: true })
  comment?: string;

  @Column({ nullable: true })
  interval?: "day" | "week" | "month" | "year";
  @Column({ nullable: true })
  step?: number;
  @Column({ nullable: true })
  points?: number;
  @Column({ type: "date" })
  startDate?: Date;
  @Column({ type: "date", nullable: true })
  endDate?: Date;

  notify!: boolean;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    Reminder,
    Date
  >[] = ["changed"];
  protected static dateFieldsToBeFixed: ExtractPropertyNamesOfType<
    Reminder,
    Date | undefined
  >[] = ["startDate", "endDate"];
}
