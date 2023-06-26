export type Replace<T, K extends keyof T, N> = {
  [key in keyof K]: N;
} & Omit<T, K>;

export type ExtractPropertyNamesOfType<T, K> = {
  [S in keyof T]: T[S] extends K ? S : never;
}[keyof T];

function numberNotADate(value: any): value is number {
  return typeof value === "number";
}

export interface OauthVariables {
  access_token: string;
  access_expires: string;
  refresh_token: string;
  refresh_expires: string;
}

export default abstract class BaseModel<T> {
  protected static dateTimeFieldsToBeFixed: any;
  protected static dateFieldsToBeFixed: any;

  constructor(params: Partial<T>) {
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
      else if (typeof value === "string") params[key] = new Date(value) as any;
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
