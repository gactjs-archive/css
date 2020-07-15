import { parseCSS } from "./parseCSS";
import { generateRules } from "./generateRules";
import { createStyleSheet } from "./utils/createStyleSheet";
import { classNameGenerator } from "./utils/classNameGenerator";
import { warning } from "./utils/warning";

const styleSheet = createStyleSheet();

/**
 * Declares a scoped stylesheet.
 */
export function css(
  strings: TemplateStringsArray,
  ...values: Array<any>
): string {
  // used generally as a scope key
  const className = classNameGenerator();

  const source = strings.reduce(function(s, v, index) {
    return s + (index > 0 ? values[index - 1] : "") + v;
  }, "");

  const rules = generateRules(parseCSS(source, className));

  for (const rule of rules) {
    try {
      styleSheet.insertRule(rule);
    } catch {
      warning(`Browser could not understand the following CSSRule: ${rule}`);
    }
  }

  return className;
}
