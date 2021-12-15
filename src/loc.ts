import IO, { Fiber, Ref } from "effective.ts";
import R, { sum } from "ramda";
import {
  BigIntStats,
  Dirent,
  readDir,
  readFile,
  stat,
  Stats,
} from "./file-system";
import { join as joinPath } from "path";
import { Language, languagesByFileExtension } from "./languages";
import { Queue } from "./queue";
import { forEach } from "./utils";

const PARALLELISM = 8;

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

interface FileSystemEntry {
  path: string;
  stats: Stats | BigIntStats | Dirent;
}

export function generateLinesOfCodeReport(
  paths: string[]
): IO<Summary, NodeJS.ErrnoException> {
  return Ref.create<Summary>({ languages: [] }).andThen((summaryRef) =>
    Queue.create<FileSystemEntry>().andThen((workQueue) =>
      forEach(entryFromPath, paths)
        .andThen(forEach(workQueue.add))
        .andThen(() =>
          IO.parallel(
            Array(PARALLELISM)
              .fill(0)
              .map(() => processNextEntry(workQueue, summaryRef))
          )
        )
        .andThen(() => summaryRef.get)
    )
  );
}

function processNextEntry(
  workQueue: Queue<FileSystemEntry>,
  summaryRef: Ref<Summary>
): IO<void, NodeJS.ErrnoException> {
  return workQueue
    .remove()
    .timeout(100, "milliseconds")
    .andThen((entry) => analyseEntry(entry, workQueue, summaryRef))
    .andThen(() => processNextEntry(workQueue, summaryRef))
    .catch(() => IO.void);
}

function entryFromPath(
  path: string
): IO<FileSystemEntry, NodeJS.ErrnoException> {
  return stat(path).map((stats) => ({ path, stats }));
}

function analyseEntry(
  entry: FileSystemEntry,
  workQueue: Queue<FileSystemEntry>,
  summaryRef: Ref<Summary>
): IO<void, NodeJS.ErrnoException> {
  if (entry.stats.isFile()) {
    return analyseFile(entry.path, summaryRef);
  } else if (entry.stats.isDirectory()) {
    return analyseDirectory(entry.path, workQueue, summaryRef);
  }
  return IO.void;
}

function analyseFile(
  path: string,
  summaryRef: Ref<Summary>
): IO<void, NodeJS.ErrnoException> {
  const language = languagesByFileExtension[fileExtension(path)];

  if (!language) {
    return IO.void;
  }

  const initialReport: FileReport = {
    filePath: path,
    language,
    linesOfCode: 0,
    blankLines: 0,
    commentLines: 0,
  };

  return readFile(path, "utf8")
    .map((fileContent) =>
      (fileContent as string)
        .split("\n")
        .reduce((report, line, index, lines) => {
          if (isBlank(line)) {
            // Do not count a trailing newline as a blank line.
            if (line === "" && index === lines.length - 1) {
              return report;
            }

            return { ...report, blankLines: report.blankLines + 1 };
          }
          if (isComment(line, language)) {
            return { ...report, commentLines: report.commentLines + 1 };
          }
          return { ...report, linesOfCode: report.linesOfCode + 1 };
        }, initialReport)
    )
    .andThen((fileReport) =>
      summaryRef
        .modify((currentSummary) => addFileReport(currentSummary, fileReport))
        .as(undefined)
    );
}

function analyseDirectory(
  path: string,
  workQueue: Queue<FileSystemEntry>,
  summaryRef: Ref<Summary>
): IO<void, NodeJS.ErrnoException> {
  return readDir(path, { encoding: "utf8", withFileTypes: true })
    .map(R.map((stats) => ({ path: joinPath(path, stats.name), stats })))
    .andThen(forEach(workQueue.add))
    .andThen(() => IO.void);
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

function fileExtension(path: string): string {
  const match = path.match(/\.(\w+)$/);
  return match ? match[1] : "";
}

function isBlank(line: string): boolean {
  return line.match(/^\s*$/) !== null;
}

function isComment(line: string, language: Language): boolean {
  return language.regExps.singleLineComment?.test(line) ?? false;
}
