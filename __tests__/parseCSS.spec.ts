import { parseCSS } from "../src/parseCSS";
import {
  CSSRule,
  ParsedRuleSet,
  ParsedKeyframes,
  ParsedConditionalGroup,
  ConditionalGroupType,
  ParsedRule,
} from "../src/types";

/**
 * Dummy tagged template for syntax highlighting.
 */
function css(strings: TemplateStringsArray, ...values: Array<any>): string {
  return strings.reduce(function(s, v, index) {
    return s + (index > 0 ? values[index - 1] : "") + v;
  }, "");
}

function indexOfRuleWithSelector(
  rules: Array<ParsedRule>,
  selector: string
): number {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (rule.type === CSSRule.RuleSet && rule.selector === selector) {
      return i;
    }
  }

  return -1;
}

describe("parseCSS", function() {
  test("single root ruleset", function() {
    const source = css`
      background: red;
      font-size: 1em;
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRule: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a",
      declarations: {
        background: "red",
        "font-size": "1em",
      },
    };

    expect(rules).toHaveLength(1);
    expect(rules).toContainEqual(expectedRule);
  });

  test("nested ruleset", function() {
    const source = css`
      p {
        font-size: 1em;
        color: blue;

        span {
          font-size: 0.8em;

          strong {
            font-weight: bold;
          }
        }
      }
    `;

    const { rules } = parseCSS(source, "a");

    const expectedRuleOne: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a p",
      declarations: {
        color: "blue",
        "font-size": "1em",
      },
    };

    const expectedRuleTwo: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a p span",
      declarations: {
        "font-size": "0.8em",
      },
    };

    const expectedRuleThree: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a p span strong",
      declarations: {
        "font-weight": "bold",
      },
    };

    expect(rules).toHaveLength(3);
    expect(rules).toContainEqual(expectedRuleOne);
    expect(rules).toContainEqual(expectedRuleTwo);
    expect(rules).toContainEqual(expectedRuleThree);
  });

  test("maintains per-level source order", function() {
    const source = css`
      li {
        color: green;
      }

      h1 {
        color: blue;
      }

      p {
        color: pink;

        span {
          margin: 0;
        }

        strong {
          padding: 0;
        }
      }
    `;

    const { rules } = parseCSS(source, "a");

    expect(indexOfRuleWithSelector(rules, ".a li")).toBeLessThan(
      indexOfRuleWithSelector(rules, ".a h1")
    );
    expect(indexOfRuleWithSelector(rules, ".a li")).toBeLessThan(
      indexOfRuleWithSelector(rules, ".a p")
    );
    expect(indexOfRuleWithSelector(rules, ".a h1")).toBeLessThan(
      indexOfRuleWithSelector(rules, ".a p")
    );
    expect(indexOfRuleWithSelector(rules, ".a p span")).toBeLessThan(
      indexOfRuleWithSelector(rules, ".a p strong")
    );
  });

  test("@keyframes", function() {
    const source = css`
      @keyframes spin {
        from {
          transform: rotate(0);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;

    const { rules, keyframesIdentifiers } = parseCSS(source, "a");
    const expectedRule: ParsedKeyframes = {
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
    };
    const expectedKeyframesIdentifiers = {
      spin: "a-spin",
    };

    expect(rules).toHaveLength(1);
    expect(rules).toContainEqual(expectedRule);
    expect(keyframesIdentifiers).toEqual(expectedKeyframesIdentifiers);
  });

  test("@media", function() {
    const source = css`
      @media (max-width: 600px) {
        font-size: 1em;
      }
    `;

    const { rules } = parseCSS(source, "a");

    const expectedRule: ParsedConditionalGroup = {
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
    };

    expect(rules).toHaveLength(1);
    expect(rules).toContainEqual(expectedRule);
  });

  test("@supports", function() {
    const source = css`
      @supports (display: grid) {
        font-size: 1em;
      }
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRule: ParsedConditionalGroup = {
      type: CSSRule.ConditionalGroup,
      groupType: ConditionalGroupType.Supports,
      query: "(display:grid)",
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a",
          declarations: {
            "font-size": "1em",
          },
        },
      ],
    };

    expect(rules).toHaveLength(1);
    expect(rules).toContainEqual(expectedRule);
  });

  test("nested conditional groups", function() {
    const source = css`
      @supports (display: grid) {
        @media (max-width: 600px) {
          p {
            color: red;
          }
        }
      }
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRule: ParsedConditionalGroup = {
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
    };

    expect(rules).toHaveLength(1);
    expect(rules).toContainEqual(expectedRule);
  });

  test("comments", function() {
    const source = css`
      /* comment over here  */
      p {
        font-size: 1em;
        /* comment over here  */
        color: blue;

        /* comment over here */

        span {
          font-size: 0.8em;

          /* comment over here 
             comment over here 
          */

          strong {
            /* comment over here  */
            font-weight: bold;
          }
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0);
        }
        /* comment over here */

        to {
          transform: rotate(360deg);
        }
      }
    `;

    const { rules, keyframesIdentifiers } = parseCSS(source, "a");

    const expectedRuleOne: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a p",
      declarations: {
        color: "blue",
        "font-size": "1em",
      },
    };

    const expectedRuleTwo: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a p span",
      declarations: {
        "font-size": "0.8em",
      },
    };

    const expectedRuleThree: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a p span strong",
      declarations: {
        "font-weight": "bold",
      },
    };

    const expectedRuleFour: ParsedKeyframes = {
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
    };

    const expectedKeyframesIdentifiers = {
      spin: "a-spin",
    };

    expect(rules).toHaveLength(4);
    expect(rules).toContainEqual(expectedRuleOne);
    expect(rules).toContainEqual(expectedRuleTwo);
    expect(rules).toContainEqual(expectedRuleThree);
    expect(rules).toContainEqual(expectedRuleFour);
    expect(keyframesIdentifiers).toEqual(expectedKeyframesIdentifiers);
  });

  test("throws on @rule within a nested ruleset", function() {
    const source = css`
      p {
        @keyframes spin {
        }
      }
    `;

    expect(function() {
      parseCSS(source, "a");
    }).toThrowError("Unexpected at-rule");
  });

  test("throws on @rule within a keyframes", function() {
    const source = `
      @keyframes spin {
        @media (max-width: 600px) {
        }
      }
    `;

    expect(function() {
      parseCSS(source, "a");
    }).toThrowError("Unexpected at-rule");
  });

  test("throws on invalid declaration", function() {
    expect(function() {
      parseCSS("font-size 12px;", "a");
    }).toThrowError("Invalid declaration");
  });

  test("throws on invalid @ rule", function() {
    expect(function() {
      parseCSS("@charset {}", "a");
    }).toThrowError(
      "The only at-rules allowed are @keyframes, @media, and @supports"
    );
  });

  test("throws on unexpected {", function() {
    expect(function() {
      parseCSS("{", "a");
    }).toThrowError("Unexpected {");

    expect(function() {
      parseCSS("p { { }", "a");
    }).toThrowError("Unexpected {");
  });

  test("throws on unbalanced }", function() {
    expect(function() {
      parseCSS("font-size: 12px; p{color:blue;}}", "a");
    }).toThrowError("Unbalanced }");
  });

  test("excludes empty rulesets", function() {
    const source = css`
      p {
        span {
        }
      }

      li {
      }
    `;

    const { rules } = parseCSS(source, "a");

    expect(rules).toHaveLength(0);
  });

  test("excludes empty rulesets in keyframes", function() {
    const source = css`
      @keyframes spin {
        from {
        }

        to {
          transform: rotate(360deg);
        }
      }
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRule: ParsedKeyframes = {
      type: CSSRule.Keyframes,
      identifier: "a-spin",
      steps: [
        { selector: "to", declarations: { transform: "rotate(360deg)" } },
      ],
    };

    expect(rules).toContainEqual(expectedRule);
  });

  test("finds scattered declarations", function() {
    const source = css`
      font-size: 12px;

      p {
        color: blue;
      }

      color: purple;

      span {
        font-family: Arial, Helvetica, sans-serif;
      }

      text-decoration: underline;
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRootRule: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a",
      declarations: {
        "font-size": "12px",
        color: "purple",
        "text-decoration": "underline",
      },
    };

    const rootRule = rules[indexOfRuleWithSelector(rules, ".a")];

    expect(rootRule).toEqual(expectedRootRule);
  });

  test("allows forward slash in calc", function() {
    const source = css`
      width: calc(100vw / 3);
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRootRule: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a",
      declarations: {
        width: "calc(100vw / 3)",
      },
    };

    const rootRule = rules[indexOfRuleWithSelector(rules, ".a")];

    expect(rootRule).toEqual(expectedRootRule);
  });

  test("pseudo-classes", function() {
    const source = css`
      :hover {
        font-size: 1.2em;
      }
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRule: ParsedRuleSet = {
      type: CSSRule.RuleSet,
      selector: ".a:hover",
      declarations: {
        "font-size": "1.2em",
      },
    };

    expect(rules).toContainEqual(expectedRule);
  });

  test("@keyframes within a conditional group", function() {
    const source = css`
      @media (max-width: 600px) {
        @keyframes spin {
          from {
            transform: rotate(0);
          }
          to {
            transform: rotate(360deg);
          }
        }
      }
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRule: ParsedConditionalGroup = {
      type: CSSRule.ConditionalGroup,
      groupType: ConditionalGroupType.Media,
      query: "(max-width:600px)",
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
    };

    expect(rules).toContainEqual(expectedRule);
  });

  test("nested ruleset within a conditional group", function() {
    const source = css`
      @media (max-width: 600px) {
        p {
          span {
            font-size: 0.8em;
          }
        }
      }
    `;

    const { rules } = parseCSS(source, "a");
    const expectedRule: ParsedConditionalGroup = {
      type: CSSRule.ConditionalGroup,
      groupType: ConditionalGroupType.Media,
      query: "(max-width:600px)",
      rules: [
        {
          type: CSSRule.RuleSet,
          selector: ".a p span",
          declarations: {
            "font-size": "0.8em",
          },
        },
      ],
    };

    expect(rules).toContainEqual(expectedRule);
  });
});
