import { Column, Entity, PrimaryColumn } from "typeorm";
import BaseModel from "../utils/BaseModel";

@Entity()
export default class KeyValue extends BaseModel<KeyValue> {
  @PrimaryColumn()
  type: string;

  @PrimaryColumn()
  name: string;

  @Column()
  value: string;
}
