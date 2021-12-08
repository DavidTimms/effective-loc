// TODO add support for multiline comments.

export interface Language {
  readonly name: string;
  readonly regExps: {
    singleLineComment?: RegExp;
  };
}

export const typescript: Language = {
  name: "TypeScript",
  regExps: {
    singleLineComment: /^\s*\/\/.*/,
  },
};

export const javascript: Language = {
  name: "JavaScript",
  regExps: typescript.regExps,
};

export const python: Language = {
  name: "Python",
  regExps: {
    singleLineComment: /^\s*#.*/,
  },
};

export const languagesByFileExtension: Partial<Record<string, Language>> = {
  ts: typescript,
  js: javascript,
  py: python,
};
