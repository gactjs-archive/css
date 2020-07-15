import { css } from "../src/css";

describe("css", function() {
  test("returns scope class", function() {
    const className = css`
      font-size: ${1}em;
    `;

    expect(typeof className).toBe("string");
  });
});
