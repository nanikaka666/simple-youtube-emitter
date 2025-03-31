export abstract class CountBase {
  readonly value: number;
  constructor(value: number) {
    CountBase.#validate(value);
    this.value = value;
  }
  static #validate(value: number) {
    if (value < 0) {
      throw new Error("value must be non-negative.");
    }
    if (!Number.isSafeInteger(value)) {
      throw new Error("value is too large.");
    }
  }
}
