import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel from "../utils/BaseModel";

@Entity()
export default class Currency extends BaseModel<Currency> {
  @PrimaryColumn()
  id!: number;

  @Column()
  changed!: number;

  @Column()
  rate!: number;

  @Column()
  shortTitle!: string;

  @Column()
  symbol!: string;

  @Column()
  title!: string;
}
