import { classNameGenerator } from "../../src/utils/classNameGenerator";

describe("classNameGenerator", function() {
  test("generates an infinite stream of unique classNames", function() {
    const seen = new Set();

    for (let i = 0; i < 1000; i++) {
      const className = classNameGenerator();
      expect(seen.has(className)).toBe(false);
      seen.add(className);
    }
  });
});
