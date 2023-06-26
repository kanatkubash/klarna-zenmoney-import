import BaseModel, { ExtractPropertyNamesOfType } from "../utils/BaseModel";
import { ZenmoneyResponse } from "./ZenMoneyResponse";

export default class Deletion extends BaseModel<Deletion> {
  id!: string;
  object!: Pick<ZenmoneyResponse, "transaction" | "merchant" | "tag">;
  stamp!: Date;
  user!: number;

  protected static dateTimeFieldsToBeFixed: ExtractPropertyNamesOfType<
    Deletion,
    Date
  >[] = ["stamp"];
}
