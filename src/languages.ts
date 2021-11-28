export interface Language {
  readonly name: string;
  // TODO add comment regex
}

export const typescript: Language = {
  name: "TypeScript",
};

export const javascript: Language = {
  name: "JavaScript",
};

export const python: Language = {
  name: "Python",
};

export const languagesByFileExtension = {
  ts: typescript,
  js: javascript,
  py: python,
};
