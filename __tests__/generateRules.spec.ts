import { generateRules } from "../src/generateRules";
import { CSSRule, ConditionalGroupType, ParsedCSS } from "../src/types";

describe("generateRules", function() {
  test("ruleset", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a",
          declarations: {
            background: "red",
            "font-size": "1em",
          },
        },
      ],
      keyframesIdentifiers: {},
    };

    const rules = generateRules(parsedCSS);
    const rule = rules[0];

    expect(rules).toHaveLength(1);
    expect(rule.startsWith(".a{")).toBe(true);
    expect(rule.includes("background:red;")).toBe(true);
    expect(rule.includes("font-size:1em;")).toBe(true);
  });

  test("@keyframes", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.Keyframes,
          identifier: "a-spin",
          steps: [
            {
              selector: "from",
              declarations: {
                transform: "rotate(0)",
              },
            },
            {
              selector: "to",
              declarations: {
                transform: "rotate(360deg)",
              },
            },
          ],
        },
      ],
      keyframesIdentifiers: {
        spin: "a-spin",
      },
    };

    const rules = generateRules(parsedCSS);
    const rule = rules[0];

    expect(rules).toHaveLength(1);
    expect(rule.startsWith("@keyframes a-spin{")).toBe(true);
    expect(rule.includes("from{transform:rotate(0)")).toBe(true);
    expect(rule.includes("to{transform:rotate(360deg)")).toBe(true);
  });

  test("conditional group", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.ConditionalGroup,
          groupType: ConditionalGroupType.Media,
          query: "(max-width:600px)",
          rules: [
            {
              type: CSSRule.RuleSet,
              selector: ".a",
              declarations: {
                "font-size": "1em",
              },
            },
          ],
        },
      ],
      keyframesIdentifiers: {},
    };

    const rules = generateRules(parsedCSS);
    const rule = rules[0];

    expect(rules).toHaveLength(1);
    expect(rule.startsWith("@media (max-width:600px) {")).toBe(true);
    expect(rule.includes(".a{font-size:1em;}")).toBe(true);
  });

  test("nested conditional groups", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.ConditionalGroup,
          groupType: ConditionalGroupType.Supports,
          query: "(display:grid)",
          rules: [
            {
              type: CSSRule.ConditionalGroup,
              groupType: ConditionalGroupType.Media,
              query: "(max-width:600px)",
              rules: [
                {
                  type: CSSRule.RuleSet,
                  selector: ".a p",
                  declarations: {
                    color: "red",
                  },
                },
              ],
            },
          ],
        },
      ],
      keyframesIdentifiers: {},
    };

    const rules = generateRules(parsedCSS);
    const rule = rules[0];

    expect(rules).toHaveLength(1);
    expect(
      rule.startsWith("@supports (display:grid) {@media (max-width:600px) {")
    ).toBe(true);
    expect(rule.includes(".a p{color:red;}")).toBe(true);
  });

  test("many rules", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a p",
          declarations: {
            color: "blue",
            "font-size": "1em",
          },
        },

        {
          type: CSSRule.RuleSet,
          selector: ".a p span",
          declarations: {
            "font-size": "0.8em",
          },
        },
        {
          type: CSSRule.RuleSet,
          selector: ".a p span strong",
          declarations: {
            "font-weight": "bold",
          },
        },
      ],
      keyframesIdentifiers: {},
    };

    const rules = generateRules(parsedCSS);

    expect(rules).toHaveLength(3);
    expect(rules[0].startsWith(".a p{"));
    expect(rules[0].startsWith(".a p span{"));
    expect(rules[0].startsWith(".a p span strong{"));
  });

  test("replaces animation-name value with scoped keyframes identifier", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a",
          declarations: {
            "animation-name": "spin",
          },
        },
      ],
      keyframesIdentifiers: {
        spin: "a-spin",
      },
    };

    const animationNameDeclaration = generateRules(parsedCSS)[0];
    expect(animationNameDeclaration.includes("animation-name:a-spin;"));
  });

  test("replaces animation-name within an animation declaration with scoped keyframes identifier", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a",
          declarations: {
            animation: "spin 1s linear",
          },
        },
      ],
      keyframesIdentifiers: {
        spin: "a-spin",
      },
    };

    const animationDeclaration = generateRules(parsedCSS)[0];
    expect(animationDeclaration.includes("animation:a-spin 1s linear;"));
  });

  test("replaces multiple animation-names within an animation declaration with scoped keyframes identifiers", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a",
          declarations: {
            animation: "spin 1s linear,bounce 1s linear",
          },
        },
      ],
      keyframesIdentifiers: {
        spin: "a-spin",
        bounce: "a-spin",
      },
    };

    const animationDeclaration = generateRules(parsedCSS)[0];
    expect(
      animationDeclaration.includes(
        "animation:a-spin 1s linear,a-bounce 1s linear;"
      )
    );
  });

  test("keeps animation-name not found within keyframes identifers", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a",
          declarations: {
            "animation-name": "spin",
          },
        },
      ],
      keyframesIdentifiers: {},
    };

    const animationNameDeclaration = generateRules(parsedCSS)[0];
    expect(animationNameDeclaration.includes("animation-name:spin;"));
  });

  test("keeps animation-name within an animation declaration not found within keyframes identifers", function() {
    const parsedCSS: ParsedCSS = {
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a",
          declarations: {
            animation: "spin 1s linear",
          },
        },
      ],
      keyframesIdentifiers: {},
    };

    const animationDeclaration = generateRules(parsedCSS)[0];
    expect(animationDeclaration.includes("animation:spin 1s linear;"));
  });
});
