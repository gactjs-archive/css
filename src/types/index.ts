/**
 * Tracks context during CSS parsing.
 */
export enum ParseMode {
  Root,
  NestedRuleSet,
  Keyframes,
  ConditionalGroup
}

/**
 * Distinguishes the types of CSS rules.
 */
export enum CSSRule {
  RuleSet,
  Keyframes,
  ConditionalGroup
}

/**
 * Distinguishes the types of conditional groups.
 */
export enum ConditionalGroupType {
  Media,
  Supports
}

/**
 * Maps  property names to values.
 */
export type Declarations = { [key: string]: string };

/**
 * A `RuleSet` is basis of all styles in CSS: a `selector` and associated declaration.
 */
export type RuleSet = {
  selector: string;
  declarations: Declarations;
};

/**
 * The result of parsing a `RuleSet`.
 */
export type ParsedRuleSet = RuleSet & {
  type: CSSRule.RuleSet;
};

/**
 * The result of parsing a `@keyframes` rule.
 */
export type ParsedKeyframes = {
  type: CSSRule.Keyframes;
  identifier: string;
  steps: Array<RuleSet>;
};

/**
 * The result of parsing a conditional group.
 */
export type ParsedConditionalGroup = {
  type: CSSRule.ConditionalGroup;
  groupType: ConditionalGroupType;
  query: string;
  rules: Array<ParsedRule>;
};

/**
 * Holds the information found in a conditional group during parsing.
 */
export type ConditionalGroupRecord = {
  type: ConditionalGroupType;
  query: string;
  rules: Array<ParsedRule>;
  selectorPath: Array<string>;
};

/**
 * The result of parsing a CSS rule.
 */
export type ParsedRule =
  | ParsedRuleSet
  | ParsedKeyframes
  | ParsedConditionalGroup;

/**
 * Maps keyframesIdentifier from source to scoped keyframesIdentifier.
 */
export type KeyframesIdentifers = { [key: string]: string };

/**
 * The result of parsing a local stylesheet.
 *
 * @remarks
 * - All `rules` are scoped via a unique className.
 */
export type ParsedCSS = {
  rules: Array<ParsedRule>;
  keyframesIdentifiers: KeyframesIdentifers;
};
