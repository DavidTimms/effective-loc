import IO from "effective.ts";
import fs from "fs";
import R from "ramda";

export type Stats = fs.Stats;
export type BigIntStats = fs.BigIntStats;
export type Dirent = fs.Dirent;

export const stat = withErrnoException(IO.lift(fs.promises.stat));

export const readFile = withErrnoException(IO.lift(fs.promises.readFile));

export const readDir = withErrnoException(IO.lift(fs.promises.readdir));

type LiftedMethod<T> = T extends (...args: infer Args) => Promise<infer Return>
  ? (...args: Args) => IO<Return, NodeJS.ErrnoException>
  : T;

export type FileHandle = {
  readonly [Method in Exclude<
    keyof fs.promises.FileHandle,
    "createReadStream" | "createWriteStream"
  >]: LiftedMethod<fs.promises.FileHandle[Method]>;
};

function liftFileHandle(fh: fs.promises.FileHandle): FileHandle {
  return {
    fd: fh.fd,
    appendFile: withErrnoException(IO.lift(fh.appendFile.bind(fh))),
    chown: withErrnoException(IO.lift(fh.chown.bind(fh))),
    chmod: withErrnoException(IO.lift(fh.chmod.bind(fh))),
    datasync: withErrnoException(IO.lift(fh.datasync.bind(fh))),
    sync: withErrnoException(IO.lift(fh.sync.bind(fh))),
    read: withErrnoException(IO.lift(fh.read.bind(fh))),
    readFile: withErrnoException(IO.lift(fh.readFile.bind(fh))),
    stat: withErrnoException(IO.lift(fh.stat.bind(fh))),
    truncate: withErrnoException(IO.lift(fh.truncate.bind(fh))),
    utimes: withErrnoException(IO.lift(fh.utimes.bind(fh))),
    writeFile: withErrnoException(IO.lift(fh.writeFile.bind(fh))),
    write: withErrnoException(IO.lift(fh.write.bind(fh))),
    writev: withErrnoException(IO.lift(fh.writev.bind(fh))),
    readv: withErrnoException(IO.lift(fh.readv.bind(fh))),
    close: withErrnoException(IO.lift(fh.close.bind(fh))),
  };
}

export const open = withErrnoException(
  R.pipe(IO.lift(fs.promises.open), (io) => io.map(liftFileHandle))
);

function withErrnoException<Args extends unknown[], Return>(
  func: (...args: Args) => IO<Return>
): (...args: Args) => IO<Return, NodeJS.ErrnoException> {
  return func as (...args: Args) => IO<Return, NodeJS.ErrnoException>;
}
