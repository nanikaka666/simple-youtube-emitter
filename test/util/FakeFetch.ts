import { IFetchPage } from "../../src/types";

export class FakeFetch implements IFetchPage {
  #contents: string;

  constructor(value: string) {
    this.#contents = value;
  }

  fetchAsString(_: string): Promise<string> {
    return Promise.resolve(this.#contents);
  }
}
