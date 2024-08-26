# Tokenator

HMAC for dinos in a hurry

## Quickstart with in-memory secrets
```typescript
import tokenator from "@enva2712/tokenator";
import memStore from "@enva2712/tokenator/mem";
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
import tokenator from "@enva2712/tokenator";
import kvStore from "@enva2712/tokenator/kv";
const kv = await Deno.openKv();
export const {tokenize, detokenize} = tokenator({store: kvStore(kv, ['prefix', 'to', 'secrets'])});
```
