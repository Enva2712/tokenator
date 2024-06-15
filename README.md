# Tokenator

HMAC for dinos in a hurry

## Quickstart with in-memory secrets
```typescript
import tokenator from "https://deno.land/x/tokenator/mod.ts";
import memStore from "https://deno.land/x/tokenator/mem.ts";
enum TokenType {
  Session = 'ses',
  // etc
}
const {tokenize, detokenize} = tokenator<TokenType>({store: memStore()});
const sessionToken = await tokenize(TokenType.Session, 'some session id');
const trustedSessionId = await detokenize(TokenType.Session, sessionToken /* or untrusted user-supplied data */);
// if trustedSessionId !== null then we can trust it wasn't tampered with
// if it's null, the token was modified, invalid, deleted secret, etc...
```

## Deno KV backed secret store
```typescript
import tokenator from "https://deno.land/x/tokenator/mod.ts";
import kvStore from "https://deno.land/x/tokenator/kv.ts";
const kv = await Deno.openKv();
export const {tokenize, detokenize} = tokenator({store: kvStore(kv, ['prefix', 'to', 'secrets'])});
```
