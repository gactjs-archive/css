/**
 * Creates a CSSStyleSheet.
 */
export function createStyleSheet(): CSSStyleSheet {
  const style = document.createElement("style");
  document.head.appendChild(style);

  return document.styleSheets[document.styleSheets.length - 1] as CSSStyleSheet;
}
