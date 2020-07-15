import { isNotEmpty } from "../../src/utils/isNotEmpty";

describe("isNotEmpty", function() {
  test("recognizes non-empty object", function() {
    expect(isNotEmpty({ a: true })).toBe(true);
  });

  test("recognizes empty object", function() {
    expect(isNotEmpty({})).toBe(false);
  });
});
