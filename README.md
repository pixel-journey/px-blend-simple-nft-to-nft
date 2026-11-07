# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Quest:** 046 — simple NFT→NFT blend  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate. Ownership is a **chain asset row**, not the client `owner` field. Minter, output supply, and burnable ingredient rows are also chain rows. Unsent mint and input actions are returned. It does not mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm, **no** custody transfer.

## What is true (executed)

| Rule | Result |
| --- | --- |
| Exact templates + chain asset owner + minter + open output + burnable rows | `ok`, unsent `mintasset` and `burnasset` |
| Missing chain asset list, short list, or a row that is not `source: "chain"` | `not chain sourced` before any action body |
| Chain `owner` is not the caller | `not the owner` |
| Chain collection or template disagrees with the claim | refused |
| Client `owner` field alone | not proof; still checked, but the chain row decides |
| `requires` is empty | `empty recipe` before any action body, even with no ingredients |
| Asset id above 2^64−1, on the claim or the chain row | `bad asset id` before any action body |
| Asset id equal to 2^64−1 | accepted |
| More than 20 ingredients (or required templates) | `bad asset batch` before any action body |
| Exactly 20 ingredients | accepted |
| Burn disposition without burnable ingredient rows | `not chain sourced` |
| Treasury disposition | unsent transfer; burnable rows are not required |

Chain rows are arguments. Omitting them is not a live `atomicassets::assets` read. Issued supply is not incremented.

## AtomicAssets v2

`mint.tokens_to_back` is always `[]`. v2 rejects a non-empty vector (`Native backing has been deprecated`). Do not fill it to "add value" to the output. A burn here is `atomicassets::burnasset` of the ingredient. It is not the v1 path that releases `backed_tokens`, and this lab does not model `backed_tokens` at all.

v2 also rejects creating a template that is both non-transferable and non-burnable. Burn disposition already requires `burnable: true` on the ingredient template row. A non-burnable ingredient cannot take the burn path. Treasury disposition is an unsent `transfer` instead.

Custody is that transfer, or the burn. There is no `holders` table to park the NFT in. v2 removed that primitive.

Map: [ATOMICASSETS-V2.md](https://github.com/pixel-journey/wax-ecosystem-blueprint-catalog/blob/main/ATOMICASSETS-V2.md).


## Live path, not shipped

```
chain asset rows + recipe + collection + output template + burnable rows
    → craft() unsent mint + input actions   [tested]
    → signed burn or treasury transfer      [not in this repo]
    → signed mint of outputsTemplateId      [not in this repo]
```

## Run

```bash
npm test
```

MIT — Pixel Journey
