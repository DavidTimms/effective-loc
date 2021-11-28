import IO from "effective.ts";
import { generateLinesOfCodeReport, Report } from "./loc";

const cli = IO.wrap(process.argv.slice(2))
  .map(parseCliArgs)
  .andThen(({ targets }) => generateLinesOfCodeReport(targets))
  .map(formatReport)
  .andThen(IO.lift(console.log));

function parseCliArgs(rawArgs: string[]): {
  targets: string[];
} {
  return { targets: rawArgs };
}

function formatReport(report: Report): string {
  return report.languages
    .map(
      (languageReport) =>
        [
          languageReport.language.name,
          `---------------------`,
          `Files:         ${languageReport.files.toString().padStart(6)}`,
          `Lines of code: ${languageReport.linesOfCode.toString().padStart(6)}`,
          `Comment lines: ${languageReport.commentLines
            .toString()
            .padStart(6)}`,
          `Blank lines:   ${languageReport.blankLines.toString().padStart(6)}`,
        ].join("\n") + "\n"
    )
    .join("\n");
}

function underline(s: string): string {
  return s + "\n" + Array(s.length).fill("-").join("");
}

function start(): void {
  cli.run();
}

start();
