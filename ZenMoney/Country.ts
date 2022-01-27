import { Column, PrimaryColumn } from "typeorm";
import BaseModel from "../utils/BaseModel";

export default class Country extends BaseModel<Country> {
  @PrimaryColumn()
  id: number;

  @Column()
  currency: number;

  @Column()
  domain?: string;

  @Column()
  title: string;
}
