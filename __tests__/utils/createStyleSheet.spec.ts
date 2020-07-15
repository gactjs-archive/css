import { createStyleSheet } from "../../src/utils/createStyleSheet";

describe("createStyleSheet", function() {
  test("creates StyleSheet", function() {
    const styleSheetCountBefore = document.styleSheets.length;
    createStyleSheet();
    const styleSheetCountAfter = document.styleSheets.length;
    expect(styleSheetCountAfter - styleSheetCountBefore).toBe(1);
  });
});
