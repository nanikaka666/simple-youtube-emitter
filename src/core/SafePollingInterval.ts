import { PollingInterval } from "./PollingInterval";

export class SafePollingInterval extends PollingInterval {
  constructor(value: number) {
    super(value);
    if (value < 10 * 1000) {
      throw new Error("interval is must be equal or greater than 10 seconds.");
    }
  }
}
