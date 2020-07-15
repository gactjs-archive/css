import {
  Declarations,
  KeyframesIdentifers,
  CSSRule,
  ConditionalGroupType,
  RuleSet,
  ParsedCSS,
} from "./types";

/**
 * Ensures animations reference the locally qualified keyframes when the
 * keyframes were declared locally.
 */
function scopeDeclarations(
  declarations: Declarations,
  keyframesIdentifiers: KeyframesIdentifers
): string {
  const finalDeclarations = [];
  for (const [property, value] of Object.entries(declarations)) {
    let finalValue = value;
    if (property === "animation") {
      // several animation can be specified at once
      finalValue = value
        .split(",")
        .map((animation) => animation.split(" "))
        .map(([animationName, ...rest]) =>
          [keyframesIdentifiers[animationName] || animationName, ...rest].join(
            " "
          )
        )
        .join(",");
    } else if (property === "animation-name") {
      finalValue = keyframesIdentifiers[value] || value;
    }
    finalDeclarations.push(`${property}:${finalValue};`);
  }

  return finalDeclarations.join("");
}

function processRuleSet(
  { selector, declarations }: RuleSet,
  keyframesIdentifiers: KeyframesIdentifers
): string {
  return `${selector}{${scopeDeclarations(
    declarations,
    keyframesIdentifiers
  )}}`;
}

/**
 * Transforms a parsed stylesheet into rules that can be inserted using `insertRule`
 */
export function generateRules({
  rules,
  keyframesIdentifiers,
}: ParsedCSS): Array<string> {
  const finalRules: Array<string> = [];

  for (const rule of rules) {
    if (rule.type === CSSRule.RuleSet) {
      finalRules.push(
        processRuleSet(
          { selector: rule.selector, declarations: rule.declarations },
          keyframesIdentifiers
        )
      );
    } else if (rule.type === CSSRule.Keyframes) {
      const processedSteps = rule.steps
        .map((step) => processRuleSet(step, keyframesIdentifiers))
        .join("");
      finalRules.push(`@keyframes ${rule.identifier}{${processedSteps}}`);
    } else {
      const conditionalGroupRules = generateRules({
        keyframesIdentifiers,
        rules: rule.rules,
      }).join("");
      const kind =
        rule.groupType === ConditionalGroupType.Media ? "media" : "supports";
      finalRules.push(`@${kind} ${rule.query} {${conditionalGroupRules}}`);
    }
  }

  return finalRules;
}
