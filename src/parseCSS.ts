import {
  ParsedCSS,
  KeyframesIdentifers,
  ParseMode,
  ParsedRule,
  Declarations,
  RuleSet,
  ConditionalGroupRecord,
  ConditionalGroupType,
  CSSRule,
  ParsedConditionalGroup,
} from "./types";
import { isNotEmpty } from "./utils/isNotEmpty";
import {
  STAR,
  FORWARD_SLASH,
  NO_SPACE_AFTER,
  NO_SPACE_BEFORE,
  COLON,
  SEMICOLON,
  CURLY_BRACKET_LEFT,
  AT,
  CURLY_BRACKET_RIGHT,
  SPACE,
  NEWLINE,
  CARRIAGE_RETURN,
  TAB,
} from "./constants";

function computeSelector(selectorPath: Array<string>): string {
  return selectorPath.reduce(function(completeSelector, selector) {
    // (i.e pseudo-classes and pseudo-elements)
    if (selector.startsWith(":")) {
      return completeSelector + selector;
    } else {
      return completeSelector + " " + selector;
    }
  });
}

export function parseCSS(source: string, scopeKey: string): ParsedCSS {
  let mode: ParseMode = ParseMode.Root;
  const scopeSelector = `.${scopeKey}`;
  const keyframesIdentifiers: KeyframesIdentifers = {};

  /**
   * the rules must be in source order for any given level of nesting
   * but a rule that appears earlier in source but at a lower level can
   * appear later than a rule later in source but at a higher level
   * source order matters when selectors are of the same specificity
   * selectors at different levels of nesting can never have the same
   * specificity
   */

  const rules: Array<ParsedRule> = [];
  const selectorPath = [scopeSelector];
  let currentDeclarations: Declarations = {};
  const declarationsStack: Array<Declarations> = [currentDeclarations];

  // position in source
  let position = 0;
  // the character just processed, used to remove extraneous whitespace
  let prevChar = "";

  // keyframes
  let currentKeyframesIdentifer = "";
  let currentKeyframesSelector = "";
  let keyframesSteps: Array<RuleSet> = [];

  // conditional groups (@media, @supports)
  let currentConditionalGroup: ConditionalGroupRecord | null = null;
  const conditionalGroupsStack: Array<ConditionalGroupRecord> = [];

  // chars consumed from next semantic unit
  let buffer: Array<string> = [];

  function startConditionalGroup(
    type: ConditionalGroupType,
    query: string
  ): void {
    currentConditionalGroup = {
      type,
      query,
      rules: [],
      selectorPath: [scopeSelector],
    };

    conditionalGroupsStack.push(currentConditionalGroup);

    currentDeclarations = {};
    declarationsStack.push(currentDeclarations);
  }

  function peek(): string {
    return source[position + 1];
  }

  function handleComment(): void {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (source[position] === STAR && peek() === FORWARD_SLASH) {
        position += 2;
        return;
      }
      position++;
    }
  }

  function handleForwardSlash(): void {
    // remove if it's a comment
    if (peek() === STAR) {
      handleComment();
    } else {
      position++;
      buffer.push("/");
    }
  }

  // remove extraneous space, and normalize all space to " "
  function handleSpace(): void {
    if (
      NO_SPACE_AFTER.includes(prevChar) ||
      NO_SPACE_BEFORE.includes(peek()) ||
      buffer.length === 0
    ) {
      position++;
    } else {
      buffer.push(" ");
      position++;
    }
  }

  function handleDeclaration(): void {
    const declaration = buffer.join("");

    const [property, value] = declaration.split(COLON);

    if (!property || !value) {
      throw Error(`Invalid declaration: ${declaration}`);
    }

    // overwriting a previously declared property conforms to CSS semantics
    currentDeclarations[property] = value;
  }

  function handleRoot(): void {
    const current = source[position];

    switch (current) {
      case FORWARD_SLASH:
        handleForwardSlash();
        break;

      case SEMICOLON:
        handleDeclaration();
        buffer = [];
        position++;
        break;

      case CURLY_BRACKET_LEFT: {
        const ruleStart = buffer.join("");

        if (!ruleStart) {
          throw Error("Unexpected {");
        }

        if (ruleStart.startsWith("@keyframes")) {
          mode = ParseMode.Keyframes;
          currentKeyframesIdentifer = ruleStart.split(" ")[1];
          keyframesIdentifiers[
            currentKeyframesIdentifer
          ] = `${scopeKey}-${currentKeyframesIdentifer}`;
        } else if (
          ruleStart.startsWith("@media") ||
          ruleStart.startsWith("@supports")
        ) {
          mode = ParseMode.ConditionalGroup;
          const kind = ruleStart.startsWith("@m")
            ? ConditionalGroupType.Media
            : ConditionalGroupType.Supports;
          const query = ruleStart.split(" ")[1];

          startConditionalGroup(kind, query);
        } else if (ruleStart[0] === AT) {
          throw Error(
            "The only at-rules allowed are @keyframes, @media, and @supports"
          );
        } else {
          mode = ParseMode.NestedRuleSet;
          const relevantSelectorPath = currentConditionalGroup
            ? currentConditionalGroup.selectorPath
            : selectorPath;
          relevantSelectorPath.push(ruleStart);
          currentDeclarations = {};
          declarationsStack.push(currentDeclarations);
        }

        position++;
        buffer = [];
        break;
      }

      /**
       * The end of a ConditionalGroup if in ConditionalGroup mode.
       * Otherwise, means we have unbalanced bracket.
       *
       * a CURLY_BRACKET_LEFT always takes us out of root mode
       * the corresponding CURLY_BRACKET_RIGHT is consumed before we return
       * thus, a CURLY_BRACKET_RIGHT in root mode means unbalanced brackets
       */
      case CURLY_BRACKET_RIGHT:
        if (mode === ParseMode.ConditionalGroup) {
          if (isNotEmpty(currentDeclarations)) {
            currentConditionalGroup!.rules.push({
              type: CSSRule.RuleSet,
              selector: scopeSelector,
              declarations: currentDeclarations,
            });
          }

          const rule: ParsedConditionalGroup = {
            type: CSSRule.ConditionalGroup,
            groupType: currentConditionalGroup!.type,
            query: currentConditionalGroup!.query,
            rules: currentConditionalGroup!.rules,
          };

          conditionalGroupsStack.pop();
          if (conditionalGroupsStack.length) {
            currentConditionalGroup =
              conditionalGroupsStack[conditionalGroupsStack.length - 1];
            currentConditionalGroup.rules.push(rule);
          } else {
            currentConditionalGroup = null;
            mode = ParseMode.Root;
            rules.push(rule);
          }

          declarationsStack.pop();
          currentDeclarations = declarationsStack[declarationsStack.length - 1];
          position++;
        } else {
          throw Error("Unbalanced }");
        }
        break;

      case SPACE:
      case NEWLINE:
      case CARRIAGE_RETURN:
      case TAB:
        handleSpace();
        break;

      default:
        buffer.push(current);
        position++;
    }

    prevChar = current;
  }

  function handleNestedRuleSet(): void {
    const current = source[position];

    switch (current) {
      case FORWARD_SLASH:
        handleForwardSlash();
        break;

      case SEMICOLON:
        handleDeclaration();
        buffer = [];
        position++;
        break;

      case CURLY_BRACKET_LEFT: {
        const selector = buffer.join("");

        if (!selector) {
          throw Error("Unexpected {");
        }

        if (selector[0] === AT) {
          throw Error("Unexpected at-rule");
        }

        const relevantSelectorPath = currentConditionalGroup
          ? currentConditionalGroup.selectorPath
          : selectorPath;
        relevantSelectorPath.push(selector);
        currentDeclarations = {};
        declarationsStack.push(currentDeclarations);

        position++;
        buffer = [];
        break;
      }

      // end of current nested set
      case CURLY_BRACKET_RIGHT: {
        const relevantSelectorPath = currentConditionalGroup
          ? currentConditionalGroup.selectorPath
          : selectorPath;

        const relevantRules = currentConditionalGroup
          ? currentConditionalGroup.rules
          : rules;

        const selector = computeSelector(relevantSelectorPath);
        if (isNotEmpty(currentDeclarations)) {
          relevantRules.push({
            type: CSSRule.RuleSet,
            selector,
            declarations: currentDeclarations,
          });
        }

        declarationsStack.pop();
        currentDeclarations = declarationsStack[declarationsStack.length - 1];

        relevantSelectorPath.pop();

        if (relevantSelectorPath.length === 1) {
          mode = currentConditionalGroup
            ? ParseMode.ConditionalGroup
            : ParseMode.Root;
        }

        position++;
        break;
      }

      case SPACE:
      case NEWLINE:
      case CARRIAGE_RETURN:
      case TAB:
        handleSpace();
        break;

      default:
        buffer.push(current);
        position++;
    }

    prevChar = current;
  }

  function handleKeyframes(): void {
    const current = source[position];

    switch (current) {
      case FORWARD_SLASH:
        handleForwardSlash();
        break;

      case SEMICOLON:
        handleDeclaration();
        buffer = [];
        position++;
        break;

      case CURLY_BRACKET_LEFT:
        if (buffer[0] === AT) {
          throw Error("Unexpected at-rule");
        }

        currentKeyframesSelector = buffer.join("");
        currentDeclarations = {};
        declarationsStack.push(currentDeclarations);

        position++;
        buffer = [];
        break;

      case CURLY_BRACKET_RIGHT:
        // the end of the current @keyframes
        if (!currentKeyframesSelector) {
          const relevantRules = currentConditionalGroup
            ? currentConditionalGroup.rules
            : rules;

          relevantRules.push({
            type: CSSRule.Keyframes,
            identifier: `${scopeKey}-${currentKeyframesIdentifer}`,
            steps: keyframesSteps,
          });

          mode = currentConditionalGroup
            ? ParseMode.ConditionalGroup
            : ParseMode.Root;
          currentKeyframesIdentifer = "";
          keyframesSteps = [];
        } else {
          // remove empty keyframes steps
          if (isNotEmpty(currentDeclarations)) {
            keyframesSteps.push({
              selector: currentKeyframesSelector,
              declarations: currentDeclarations,
            });
          }

          currentKeyframesSelector = "";
          declarationsStack.pop();
          currentDeclarations = declarationsStack[declarationsStack.length - 1];
        }

        position++;
        break;

      case SPACE:
      case NEWLINE:
      case CARRIAGE_RETURN:
      case TAB:
        handleSpace();
        break;

      default:
        buffer.push(current);
        position++;
    }

    prevChar = current;
  }

  while (position < source.length) {
    if (mode === ParseMode.Root || mode === ParseMode.ConditionalGroup) {
      handleRoot();
    } else if (mode === ParseMode.NestedRuleSet) {
      handleNestedRuleSet();
    } else {
      handleKeyframes();
    }
  }

  // add root declarations if any
  if (isNotEmpty(currentDeclarations)) {
    rules.push({
      type: CSSRule.RuleSet,
      selector: scopeSelector,
      declarations: currentDeclarations,
    });
  }

  return { rules, keyframesIdentifiers };
}
