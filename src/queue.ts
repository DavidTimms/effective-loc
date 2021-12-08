import IO from "effective.ts";

type QueueState<A> =
  | {
      tag: "EMPTY";
      blockedRemovers: Array<(item: A) => void>;
    }
  | {
      tag: "NON_EMPTY";
      items: Array<A>;
    };

const QueueState = {
  empty<A>(): QueueState<A> {
    return { tag: "EMPTY", blockedRemovers: [] };
  },
  nonEmpty<A>(item: A): QueueState<A> {
    return { tag: "NON_EMPTY", items: [item] };
  },
};

export class Queue<A> {
  private state: QueueState<A> = QueueState.empty();

  add(item: A): IO<void, never> {
    return IO(() => {
      if (this.state.tag === "EMPTY") {
        const resolveRemover = this.state.blockedRemovers.shift();
        if (resolveRemover === undefined) {
          this.state = QueueState.nonEmpty(item);
        } else {
          resolveRemover(item);
        }
      } else {
        this.state.items.push(item);
      }
    }).castError<never>();
  }

  remove(): IO<A, never> {
    return IO(() => {
      if (this.state.tag === "EMPTY") {
        const blockedRemovers = this.state.blockedRemovers;
        return new Promise<A>((resolve) => {
          blockedRemovers.push(resolve);
        });
      } else {
        const item = this.state.items.shift()!;
        if (this.state.items.length === 0) {
          this.state = QueueState.empty();
        }
        return item;
      }
    }).castError<never>();
  }
}
