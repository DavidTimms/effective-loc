import IO from "effective.ts";
import fs from "fs";

export const stat = withErrnoException(IO.lift(fs.promises.stat));

function withErrnoException<Args extends unknown[], Return>(
  func: (...args: Args) => IO<Return>
): (...args: Args) => IO<Return, NodeJS.ErrnoException> {
  return func as (...args: Args) => IO<Return, NodeJS.ErrnoException>;
}
