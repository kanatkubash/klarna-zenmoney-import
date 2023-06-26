import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";

@Entity()
export default class Category extends BaseModel<Category> {
  @PrimaryColumn()
  id!: string;
  @Column({ type: "datetime" })
  changed!: Date;
  @Column()
  user!: number;
  @Column()
  title!: string;
  @Column({ nullable: true })
  parent?: string;
  @Column({ nullable: true })
  icon?: string;
  @Column({ nullable: true })
  picture?: string;
  @Column({ nullable: true })
  color?: number;
  @Column()
  showIncome!: boolean;
  @Column()
  showOutcome!: boolean;
  @Column()
  budgetIncome!: boolean;
  @Column()
  budgetOutcome!: boolean;
  @Column({ nullable: true })
  required?: boolean;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    Category,
    Date
  >[] = ["changed"];
}
