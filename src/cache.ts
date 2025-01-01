import { Redis } from "ioredis";

export class Cache {
  #client: Redis;
  readonly #key: string;

  constructor(client: Redis, key = "usrbg-proxy:users") {
    this.#client = client;
    this.#key = key;
  }

  async set(uid: string, etag: string) {
    await this.#client.hset(this.#key, uid, etag);
  }

  async setAll(data: { [key: string]: string }) {
    const commandStack = this.#client.multi();
    commandStack.del(this.#key);

    const entries = Object.entries(data);
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);
      commandStack.hset(this.#key, ...chunk.flat());
    }
    await commandStack.exec();
  }

  getAll(): Promise<{ [key: string]: string }> {
    return this.#client.hgetall(this.#key);
  }

  async delete(uid: string) {
    await this.#client.hdel(this.#key, uid);
  }
}
