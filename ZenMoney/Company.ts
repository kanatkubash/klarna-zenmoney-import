import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class Company extends BaseModel<Company> {
  @PrimaryColumn()
  id!: number;
  @Column({ type: "datetime" })
  changed!: Date;
  @Column()
  title!: string;
  @Column({ nullable: true })
  fullTitle?: string;
  @Column({ nullable: true })
  www?: string;
  @Column({ nullable: true })
  country?: string;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    Company,
    Date
  >[] = ["changed"];
}
