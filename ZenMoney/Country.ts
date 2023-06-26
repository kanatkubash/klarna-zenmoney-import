import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel from "../utils/BaseModel";

@Entity()
export default class Country extends BaseModel<Country> {
  @PrimaryColumn()
  id!: number;

  @Column()
  currency!: number;

  @Column({ nullable: true })
  domain?: string;

  @Column()
  title!: string;
}
