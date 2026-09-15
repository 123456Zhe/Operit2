import { connect, Socket } from 'node:net';
import { decode, encode } from '@msgpack/msgpack';

/** One Core watch event returned through Plugin SDK IPC. */
export interface OperitPluginSdkEvent {
  readonly requestId: string | null;
  readonly targetObjectId: number;
  readonly propertyName: string;
  readonly kind: string;
  readonly value: unknown;
}

/** One caller-owned Core push stream. */
export interface OperitPluginSdkPushSink {
  add(value: unknown): Promise<void>;
  close(): Promise<void>;
}

/** Concrete Node.js Plugin SDK client with its IPC carrier built in. */
export class OperitPluginSdkClient {
  private constructor(private readonly socket: Socket) {
    socket.on('data', (chunk) => this.onBytes(chunk));
    socket.on('close', () => this.fail(new Error('Plugin SDK IPC connection closed')));
  }

  private readonly pending = new Map<string, (value: unknown, error?: Error) => void>();
  private readonly watchQueues = new Map<string, AsyncQueue<OperitPluginSdkEvent>>();
  private buffer = Buffer.alloc(0);
  private nextId = 1;

  /** Connects to the standard TCP loopback endpoint. */
  public static connectTcp(host = '127.0.0.1', port = 18732): Promise<OperitPluginSdkClient> {
    return new Promise((resolve, reject) => {
      const socket = connect(port, host, () => resolve(new OperitPluginSdkClient(socket)));
      socket.once('error', reject);
    });
  }

  /** Calls one generated Core method. */
  public call(targetObjectId: number, methodName: string, args?: unknown): Promise<unknown> {
    const requestId = this.requestId();
    return this.request(requestId, {
      type: 'Call',
      body: { requestId, targetObjectId, methodName, args: args ?? {} },
    });
  }

  /** Calls one route and decodes its MessagePack value. */
  public callTyped<T>(targetObjectId: number, methodName: string, args: unknown, decodeValue: (value: unknown) => T): Promise<T> {
    return this.call(targetObjectId, methodName, args).then(decodeValue);
  }

  /** Watches one generated Core property. */
  public async *watch(targetObjectId: number, propertyName: string, args?: unknown): AsyncIterable<OperitPluginSdkEvent> {
    const subscriptionId = this.requestId();
    const queue = new AsyncQueue<OperitPluginSdkEvent>();
    this.watchQueues.set(subscriptionId, queue);
    this.send({
      type: 'WatchOpen',
      body: {
        subscriptionId,
        request: { requestId: subscriptionId, targetObjectId, propertyName, args: args ?? {} },
      },
    });
    try {
      for await (const event of queue) yield event;
    } finally {
      this.watchQueues.delete(subscriptionId);
      this.send({ type: 'WatchClose', body: { subscriptionId, error: null } });
    }
  }

  /** Watches one route and decodes each MessagePack event value. */
  public async *watchTyped<T>(targetObjectId: number, propertyName: string, args: unknown, decodeValue: (value: unknown) => T): AsyncIterable<T> {
    for await (const event of this.watch(targetObjectId, propertyName, args)) yield decodeValue(event.value);
  }

  /** Opens one generated caller-owned Core input stream. */
  public async push(targetObjectId: number, methodName: string, args?: unknown): Promise<OperitPluginSdkPushSink> {
    const pushId = this.requestId();
    await this.request(pushId, {
      type: 'PushOpen',
      body: { requestId: pushId, targetObjectId, methodName, args: args ?? {} },
    });
    let sequence = 0;
    return {
      add: (value) => this.request(`${pushId}:${sequence}`, {
        type: 'PushItem',
        body: { pushId, sequence: sequence++, args: value },
      }).then(() => undefined),
      close: () => this.request(pushId, { type: 'PushClose', body: { pushId } }).then(() => undefined),
    };
  }

  /** Allocates one session-local request id. */
  private requestId(): string { return `plugin-sdk-${this.nextId++}`; }

  /** Sends one length-prefixed MessagePack envelope. */
  private send(message: unknown): void {
    const payload = Buffer.from(encode(message));
    const frame = Buffer.allocUnsafe(4 + payload.length);
    frame.writeUInt32BE(payload.length, 0);
    payload.copy(frame, 4);
    this.socket.write(frame);
  }

  /** Registers and sends one request awaiting its protocol acknowledgement. */
  private request(key: string, message: unknown): Promise<unknown> {
    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(key, (value, error) => error ? reject(error) : resolve(value));
    });
    this.send(message);
    return promise;
  }

  /** Parses complete framed IPC payloads. */
  private onBytes(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 4) {
      const length = this.buffer.readUInt32BE(0);
      if (this.buffer.length < length + 4) return;
      const message = decode(this.buffer.subarray(4, length + 4)) as Record<string, unknown>;
      this.buffer = this.buffer.subarray(length + 4);
      this.onMessage(message);
    }
  }

  /** Routes one protocol envelope to its pending request or watch queue. */
  private onMessage(message: Record<string, unknown>): void {
    const body = (message.body ?? {}) as Record<string, unknown>;
    switch (message.type) {
      case 'CallResponse': this.complete(String(body.requestId), this.result(body.result)); break;
      case 'WatchEvent': this.watchQueues.get(String(body.subscriptionId))?.push(this.event(body.event)); break;
      case 'WatchClose': this.watchQueues.get(String(body.subscriptionId))?.close(); break;
      case 'WatchOpened': this.complete(String(body.subscriptionId), this.result(body.result)); break;
      case 'PushOpened': this.complete(String(body.pushId), this.result(body.result)); break;
      case 'PushItemResult': this.complete(`${body.pushId}:${body.sequence}`, this.result(body.result)); break;
      case 'PushClosed': this.complete(String(body.pushId), this.result(body.result)); break;
      case 'ProtocolError': this.fail(this.error(body.error)); break;
    }
  }

  /** Completes one registered protocol request. */
  private complete(key: string, result: unknown): void {
    const callback = this.pending.get(key);
    if (!callback) return;
    this.pending.delete(key);
    callback(result);
  }

  /** Converts a serialized Result into a value or exception. */
  private result(value: unknown): unknown {
    if (value && typeof value === 'object' && 'Err' in value) throw this.error((value as { Err: unknown }).Err);
    return value && typeof value === 'object' && 'Ok' in value ? (value as { Ok: unknown }).Ok : value;
  }

  /** Converts one serialized Core error. */
  private error(value: unknown): Error { return new Error(String((value as { message?: unknown })?.message ?? value)); }

  /** Converts one serialized Core event. */
  private event(value: unknown): OperitPluginSdkEvent {
    const event = value as Record<string, unknown>;
    return { requestId: event.requestId as string | null, targetObjectId: event.targetObjectId as number, propertyName: event.propertyName as string, kind: String(event.kind), value: event.value };
  }

  /** Fails every pending request after a socket failure. */
  private fail(error: Error): void { for (const callback of this.pending.values()) callback(undefined, error); this.pending.clear(); }
}

/** Minimal async queue used by generated watch wrappers. */
class AsyncQueue<T> implements AsyncIterable<T>, AsyncIterator<T> {
  private readonly values: T[] = [];
  private readonly waiters: Array<(result: IteratorResult<T>) => void> = [];
  private done = false;
  /** Adds one queue value. */
  public push(value: T): void { if (this.done) return; const waiter = this.waiters.shift(); waiter ? waiter({ value, done: false }) : this.values.push(value); }
  /** Closes the queue. */
  public close(): void { this.done = true; while (this.waiters.length) this.waiters.shift()!({ value: undefined as never, done: true }); }
  /** Reads one queue value. */
  public next(): Promise<IteratorResult<T>> { if (this.values.length) return Promise.resolve({ value: this.values.shift()!, done: false }); if (this.done) return Promise.resolve({ value: undefined as never, done: true }); return new Promise((resolve) => this.waiters.push(resolve)); }
  /** Returns this queue as its async iterator. */
  public [Symbol.asyncIterator](): AsyncIterator<T> { return this; }
}
