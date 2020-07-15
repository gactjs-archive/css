export const HYPHEN = "-";
export const UNDERSCORE = "_";
export const EMPTY = "";
export const AT = "@";
export const STAR = "*";
export const FORWARD_SLASH = "/";
export const CURLY_BRACKET_LEFT = "{";
export const CURLY_BRACKET_RIGHT = "}";
export const SEMICOLON = ";";
export const COLON = ":";
export const COMMA = ",";
export const SPACE = " ";
export const NEWLINE = "\n";
export const CARRIAGE_RETURN = "\r";
export const TAB = "\t";

/**
 * Characters which never need to be followed by a space in CSS
 */
export const NO_SPACE_AFTER = [
  EMPTY,
  CURLY_BRACKET_LEFT,
  CURLY_BRACKET_RIGHT,
  SEMICOLON,
  COLON,
  SEMICOLON,
  NEWLINE,
  SPACE,
  CARRIAGE_RETURN,
  TAB,
];

/**
 * Characters which never need to be preceded by a space in CSS
 */
export const NO_SPACE_BEFORE = [
  CURLY_BRACKET_RIGHT,
  CURLY_BRACKET_LEFT,
  SEMICOLON,
  COMMA,
];

/**
 * Characters that are allowed in CSS class names.
 */
export const CLASS_ALPHABET = "_-abcdefghijklmnopqrstuvwxyz0123456789";
