import IO, { Ref } from "effective.ts";
import R from "ramda";
import { stat } from "./file-system";
import { Language, typescript } from "./languages";

export interface Summary {
  readonly languages: readonly LanguageReport[];
}

export interface LanguageReport {
  readonly language: Language;
  readonly files: number;
  readonly linesOfCode: number;
  readonly blankLines: number;
  readonly commentLines: number;
}

export interface FileReport {
  readonly filePath: string;
  readonly language: Language;
  readonly linesOfCode: number;
  readonly blankLines: number;
  readonly commentLines: number;
}

export function generateLinesOfCodeReport(
  paths: string[]
): IO<Summary, NodeJS.ErrnoException> {
  return Ref.create<Summary>({ languages: [] }).andThen((summaryRef) =>
    IO.sequence(paths.map((path) => analysePath(path, summaryRef))).andThen(
      () => summaryRef.get
    )
  );
}

function analysePath(
  path: string,
  summaryRef: Ref<Summary>
): IO<void, NodeJS.ErrnoException> {
  return stat(path).andThen((stats) => {
    if (stats.isFile()) {
      return analyseFile(path, summaryRef);
    } else if (stats.isDirectory()) {
      return analyseDirectory(path, summaryRef);
    }
    return IO.void;
  });
}

function analyseFile(
  path: string,
  summaryRef: Ref<Summary>
): IO<void, NodeJS.ErrnoException> {
  // STUB
  const fileReport = {
    filePath: path,
    language: typescript,
    linesOfCode: 0,
    blankLines: 0,
    commentLines: 0,
  };

  return summaryRef
    .modify((currentSummary) => addFileReport(currentSummary, fileReport))
    .as(undefined);
}

function analyseDirectory(
  path: string,
  summaryRef: Ref<Summary>
): IO<void, NodeJS.ErrnoException> {
  // STUB
  return IO.void;
}

function addFileReport(
  currentSummary: Summary,
  fileReport: FileReport
): Summary {
  const { language, linesOfCode, blankLines, commentLines } = fileReport;

  const index = currentSummary.languages.findIndex(
    (lr) => lr.language === language
  );

  if (index === -1) {
    const languageReport = {
      language,
      files: 1,
      linesOfCode,
      blankLines,
      commentLines,
    };
    return {
      languages: [...currentSummary.languages, languageReport],
    };
  }

  const languageReport = R.evolve(
    {
      files: R.inc,
      linesOfCode: R.add(linesOfCode),
      blankLines: R.add(blankLines),
      commentLines: R.add(commentLines),
    },
    currentSummary.languages[index]
  );

  return {
    languages: R.update(index, languageReport, currentSummary.languages),
  };
}
