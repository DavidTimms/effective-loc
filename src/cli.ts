import IO from "effective.ts";
import { generateLinesOfCodeReport, Summary } from "./loc";

const cli = IO.wrap(process.argv.slice(2))
  .andThen(parseCliArgs)
  .andThen(({ paths }) => generateLinesOfCodeReport(paths))
  .map(formatReport)
  .andThen(IO.lift(console.log))
  .catch((error) => IO.lift(console.error)(`${error}`));

function parseCliArgs(rawArgs: string[]): IO<
  {
    paths: string[];
  },
  Error
> {
  const paths = rawArgs;

  if (paths.length === 0) {
    return IO.raise(Error("No path specified"));
  }

  return IO.wrap({ paths: rawArgs });
}

function formatReport(summary: Summary): string {
  return summary.languages
    .map(
      (languageReport) =>
        [
          languageReport.language.name,
          `---------------------`,
          `Files:         ${languageReport.files.toString().padStart(8)}`,
          `Lines of code: ${languageReport.linesOfCode.toString().padStart(8)}`,
          `Comment lines: ${languageReport.commentLines
            .toString()
            .padStart(8)}`,
          `Blank lines:   ${languageReport.blankLines.toString().padStart(8)}`,
        ].join("\n") + "\n"
    )
    .join("\n");
}

function start(): void {
  cli.run();
}

start();
