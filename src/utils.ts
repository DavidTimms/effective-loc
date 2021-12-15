import IO from "effective.ts";

export function forEach<A, B, E>(
  func: (item: A) => IO<B, E>,
  items: readonly A[]
): IO<B[], E>;
export function forEach<A, B, E>(
  func: (item: A) => IO<B, E>
): (items: readonly A[]) => IO<B[], E>;
export function forEach<A, B, E>(
  func: (item: A) => IO<B, E>,
  items?: readonly A[]
): ((items: readonly A[]) => IO<B[], E>) | IO<B[], E> {
  if (items === undefined) {
    return (items: readonly A[]) => forEach(func, items);
  }
  return IO.sequence(items.map(func));
}
