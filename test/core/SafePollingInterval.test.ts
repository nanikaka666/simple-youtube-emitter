import { SafePollingInterval } from "../../src/core/SafePollingInterval";

test("valid value", () => {
  const input = 10 * 1000;
  expect(new SafePollingInterval(input).value).toBe(input);
});

test("too small value is invalid", () => {
  expect(() => new SafePollingInterval(10 * 1000 - 1).value).toThrow();
});
