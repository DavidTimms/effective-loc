import IO from "effective.ts";
import { Language, typescript } from "./languages";

export interface Report {
  readonly languages: readonly LanguageReport[];
}

export interface LanguageReport {
  readonly language: Language;
  readonly files: number;
  readonly linesOfCode: number;
  readonly blankLines: number;
  readonly commentLines: number;
}

export function generateLinesOfCodeReport(
  targets: string[]
): IO<Report, NodeJS.ErrnoException> {
  return IO.wrap({
    languages: [
      {
        language: typescript,
        files: 0,
        linesOfCode: 0,
        blankLines: 0,
        commentLines: 0,
      },
    ],
  });
}
