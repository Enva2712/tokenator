import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import tokenator from "./mod.ts";
import kvStore from "./kv.ts";
import memStore from "./mem.ts";

Deno.test("vals", async () => {
  const { tokenize, detokenize } = tokenator<"a">({ store: memStore() });
  for (const val in ["", "foo", ".foo..foo"]) {
    assertEquals(await detokenize("a", await tokenize("a", val)), val);
  }
});

Deno.test("kv & toktys", async () => {
  const kv = await Deno.openKv();
  const { tokenize, detokenize } = tokenator({
    store: kvStore(kv, ["secrets"]),
  });
  for (const ty in ["", "a", "a.a"]) {
    assertEquals(
      await detokenize(ty, await tokenize(ty, "somestr")),
      "somestr",
    );
  }
  kv.close();
});

Deno.test("untrusted input", async () => {
  const { tokenize, detokenize } = tokenator({ store: memStore() });
  for (
    const tok in ["", "garbled", await tokenize("wrongtype", "someval")]
  ) assertEquals(null, await detokenize("righttype", tok));
});
