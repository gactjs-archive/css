import { createKeyFactory } from "@gact/key";
import { CLASS_ALPHABET } from "../constants";
/**
 * Generates an infinite stream of minimal length CSS class names.
 */
export const classNameGenerator = createKeyFactory({
  alphabet: CLASS_ALPHABET,
  prefix: "_"
});
