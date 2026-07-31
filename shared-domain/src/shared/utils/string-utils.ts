const REGEX_SPECIAL_CHARS = /[\\^$.*+?()[\]{}|]/g;

export const escapeRegExp = (input: string): string => {
  if (!input) return "";
  return input.replace(REGEX_SPECIAL_CHARS, "\\$&");
};
