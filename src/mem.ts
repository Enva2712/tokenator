import type { SecretStore } from "./mod.ts";

/**
 * memStore creates an in-memory secret store
 */
const memStore = (): SecretStore => {
  const store: Record<string, ArrayBuffer> = {};
  return {
    insert(secret) {
      const id = crypto.randomUUID();
      store[id] = secret;
      return Promise.resolve(id);
    },
    load(id) {
      if (id) {
        const secret = store[id];
        return Promise.resolve(secret ? { id, secret } : null);
      } else {
        const [k] = Object.keys(store);
        return Promise.resolve(k ? { id: k, secret: store[k] } : null);
      }
    },
  };
};

export default memStore;
