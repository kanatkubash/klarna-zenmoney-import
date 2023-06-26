import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class ReminderMarker extends BaseModel<ReminderMarker> {
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

  @Column({ type: "date" })
  date!: Date;
  @Column()
  reminder!: string;
  @Column()
  state!: "planned" | "processed" | "deleted";

  notify!: boolean;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    ReminderMarker,
    Date
  >[] = ["changed"];
  protected static dateFieldsToBeFixed: ExtractPropertyNamesOfType<
    ReminderMarker,
    Date
  >[] = ["date"];
}
