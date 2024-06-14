import type { SecretStore } from "./mod.ts";

/**
 * kvStore creates a Deno KV backed secret store
 */
const kvStore = (kv: Deno.Kv, prefix: Deno.KvKey): SecretStore => ({
  async insert(secret) {
    const id = crypto.randomUUID();
    await kv.set(prefix.concat(id), secret);
    return id;
  },
  load: (id) =>
    id
      ? kv.get<ArrayBuffer>(prefix.concat(id)).then((r) =>
        r.value && { id, secret: r.value }
      )
      : kv.list<ArrayBuffer>({ prefix }, { limit: 1 }).next().then((r) =>
        r.value
          ? {
            id: r.value.key[r.value.key.length - 1] as string, // assume only strings within our prefix
            secret: r.value.value,
          }
          : null
      ),
});

export default kvStore;
