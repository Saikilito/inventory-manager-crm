import { EventEmitter } from "events";

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  createdAt: string;
}

export interface IPubSub {
  publish(triggerName: string, payload: unknown): Promise<void>;
  asyncIterator<T>(triggerName: string): AsyncIterator<T>;
}

export class SimplePubSub implements IPubSub {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  public async publish(triggerName: string, payload: unknown): Promise<void> {
    this.emitter.emit(triggerName, payload);
  }

  public asyncIterator<T>(triggerName: string): AsyncIterator<T> {
    const emitter = this.emitter;
    const pullQueue: Array<(value: IteratorResult<T>) => void> = [];
    const pushQueue: T[] = [];
    let listening = true;

    const doneResult: IteratorResult<T> = { value: undefined as IteratorResult<T>['value'], done: true };

    const pushValue = (event: T) => {
      if (pullQueue.length > 0) {
        const resolver = pullQueue.shift();
        resolver?.({ value: event, done: false });
      } else {
        pushQueue.push(event);
      }
    };

    emitter.addListener(triggerName, pushValue);

    const emptyQueue = () => {
      if (listening) {
        listening = false;
        emitter.removeListener(triggerName, pushValue);
        for (const resolve of pullQueue) {
          resolve(doneResult);
        }
        pullQueue.length = 0;
        pushQueue.length = 0;
      }
    };

    const iterator: AsyncIterableIterator<T> = {
      next(): Promise<IteratorResult<T>> {
        if (!listening && pushQueue.length === 0) {
          return Promise.resolve(doneResult);
        }
        if (pushQueue.length > 0) {
          return Promise.resolve({ value: pushQueue.shift()!, done: false });
        }
        return new Promise<IteratorResult<T>>((resolve) => {
          pullQueue.push(resolve);
        });
      },
      return(): Promise<IteratorResult<T>> {
        emptyQueue();
        return Promise.resolve(doneResult);
      },
      throw(error: unknown): Promise<IteratorResult<T>> {
        emptyQueue();
        return Promise.reject(error);
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return iterator;
  }
}

export const pubSubInstance = new SimplePubSub();
export default pubSubInstance;
