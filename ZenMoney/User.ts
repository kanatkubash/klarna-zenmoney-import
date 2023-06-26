import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class User extends BaseModel<User> {
  @PrimaryColumn()
  id!: number;
  @Column({ type: "datetime" })
  changed!: Date;
  @Column({ nullable: true })
  login?: string;
  @Column()
  currency!: number;
  @Column({ nullable: true })
  parent?: number;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    User,
    Date
  >[] = ["changed"];
}
