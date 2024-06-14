import {
  decodeBase64Url as un64,
  encodeBase64Url as b64,
} from "https://deno.land/std@0.224.0/encoding/base64url.ts";
// node did crypto apis cleaner than w3c :(

// TODO: auto-roll secrets (tokenize should support only using secrets newer
// than a given timestamp, while they're still trusted by detokenize. it's then
// up to the user to retokenize values AOAP to get end-to-end rolling secrets)

export interface SecretStore {
  /**
   * inserts a new secret into the store returning the secret's id
   */
  insert(secret: ArrayBuffer): Promise<string>;
  /**
   * loads a secret from the store given it's id. if no id is provided, load any
   * available secret. should be able to take untrusted user-provided string ids
   */
  load(id?: string): Promise<{ id: string; secret: ArrayBuffer } | null>;
}

export interface Tokenator<TokTy extends string> {
  tokenize(ty: TokTy, val: string): Promise<string>;
  detokenize(ty: TokTy, val: string): Promise<string | null>;
}

/**
 * `tokenator` is quick & easy HMAC
 *
 * ```typescript
 * import tokenator from "https://deno.land/x/tokenator/mod.ts";
 * import memStore from "https://deno.land/x/tokenator/mem.ts";
 *
 * const { tokenize, detokenize } = tokenator<"session" | "whatever">({
 *   store: memStore(),
 * });

 * const token = await tokenize("session", "somesessionid");
 * const sessionId = await detokenize("session", token); // sessionId is "somesessionid"
 * // if tampered with, sessionId would be null
 * // if a trusted token of another token type (e.g. "whatever") is passed, sessionId would be null
 * ```
 */
export default function tokenator<TokTy extends string>(
  { store }: { store: SecretStore },
): Tokenator<TokTy> {
  return {
    async tokenize(
      tokenType: TokTy,
      value: string,
    ): Promise<string> {
      const existing = await store.load();
      const [secId, k] = existing
        ? [
          existing.id,
          await crypto.subtle.importKey(
            "raw",
            existing.secret,
            { name: "HMAC", hash: { name: "SHA-512" } },
            true,
            [
              "sign",
              "verify",
            ],
          ),
        ]
        : await (async () => {
          const k = await crypto.subtle.generateKey(
            { name: "hmac", hash: { name: "SHA-512" } },
            true,
            ["sign", "verify"],
          );
          const id = await store.insert(
            await crypto.subtle.exportKey("raw", k),
          );
          return [id, k];
        })();

      const data = [b64(tokenType), b64(value), secId].join(".");
      const mac = b64(
        await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)),
      );
      return [data, mac].join(".");
    },
    async detokenize(
      expectedTokenType: TokTy,
      token: string,
    ): Promise<string | null> {
      const [tokenType64, value64, secretId, mac, ...extra] = token.split(".");
      if (!tokenType64 || !value64 || !secretId || !mac) return null;
      if (extra.length) return null;
      if (tokenType64 !== b64(expectedTokenType)) return null;
      const sec = await store.load(secretId);
      if (!sec) return null;
      const key = await crypto.subtle.importKey(
        "raw",
        sec.secret,
        { name: "HMAC", hash: { name: "SHA-512" } },
        false,
        [
          "sign",
          "verify",
        ],
      );
      const dataPart = [tokenType64, value64, secretId].join(".");
      const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        un64(mac),
        new TextEncoder().encode(dataPart),
      );
      if (!valid) return null;
      return new TextDecoder().decode(un64(value64));
    },
  };
}
