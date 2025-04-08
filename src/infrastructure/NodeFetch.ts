import { IFetchPage } from "../types";

export class NodeFetch implements IFetchPage {
  async fetchAsString(url: string): Promise<string> {
    const response = await fetch(url);
    return await response.text();
  }
}
