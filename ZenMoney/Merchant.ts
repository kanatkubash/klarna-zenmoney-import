import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class Merchant extends BaseModel<Merchant> {
  @PrimaryColumn()
  id: string;
  @Column({ type: "datetime" })
  changed: Date;
  @Column()
  user: number;
  @Column()
  title: string;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    Merchant,
    Date
  >[] = ["changed"];
}
