export type ExtractPropertyNamesOfType<T, K> = {
  [S in keyof T]: T[S] extends K ? S : never;
}[keyof T];

function numberNotADate(value: any): value is number {
  return typeof value === "number";
}

export default abstract class BaseModel<T> {
  protected static dateTimeFieldsToBeFixed;
  protected static dateFieldsToBeFixed;

  constructor(params: Partial<T> = null) {
    if (params) {
      var copy = { ...params };
      BaseModel.fixDateTimes(
        copy,
        (this.constructor as typeof BaseModel).dateTimeFieldsToBeFixed
      );
      BaseModel.fixDates(
        copy,
        (this.constructor as typeof BaseModel).dateFieldsToBeFixed
      );
      Object.assign(this, copy);
    }
  }

  static fixDateTimes<T>(
    params: Partial<T>,
    keys?: ExtractPropertyNamesOfType<T, Date>[]
  ) {
    keys?.forEach((key) => {
      var value = params[key];
      if (numberNotADate(value)) params[key] = new Date(value * 1000) as any;
    });
  }

  static fixDates<T>(
    params: Partial<T>,
    keys?: ExtractPropertyNamesOfType<T, Date>[]
  ) {
    keys?.forEach((key) => {
      var value: any = params[key];
      if (typeof value === "string") params[key] = new Date(value) as any;
    });
  }
}
