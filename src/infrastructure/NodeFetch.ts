import { IFetchPage } from "../types";
import fetch from "node-fetch";

export class NodeFetch implements IFetchPage {
  async fetchAsString(url: string): Promise<string> {
    const response = await fetch(url);
    return await response.text();
  }
}
