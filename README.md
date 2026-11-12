# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Domain:** AtomicAssets craft / blend  
> **Sources:** [SOURCES.md](SOURCES.md)  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate. Ownership is a **chain asset row**, not the client `owner` field. Minter, output supply, and burnable ingredient rows are also chain rows. Unsent mint and input actions are returned. It does not mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm, **no** custody transfer.

Official contract: [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract). WAX guides: [How-To AtomicAssets](https://docs.wax.io/build/tutorials/howto_atomicassets), [Minting NFTs](https://docs.wax.io/build/tutorials/howto_atomicassets/mint_nft).

## What is true (executed)

| Rule | Result |
| --- | --- |
| Exact templates + chain asset owner + minter + open output + burnable rows | `ok`, unsent `mintasset` and `burnasset` |
| Missing chain asset list, short list, or a row that is not `source: "chain"` | `not chain sourced` before any action body |
| Chain `owner` is not the caller | `not the owner` |
| Chain collection or template disagrees with the claim | refused |
| Client `owner` field alone | not proof; still checked, but the chain row decides |
| `requires` is empty | `empty recipe` |
| Asset id above 2^64−1 | `bad asset id` |
| More than 20 ingredients | `bad asset batch` |
| Burn disposition without burnable ingredient rows | `not chain sourced` |
| Treasury disposition | unsent transfer; burnable rows not required |

## AtomicAssets v2

`mint.tokens_to_back` is always `[]`. v2 rejects a non-empty vector (`Native backing has been deprecated`). See [ATOMICASSETS-V2.md](https://github.com/pixel-journey/wax-ecosystem-blueprint-catalog/blob/main/ATOMICASSETS-V2.md).

## Live path, not shipped

```
chain asset rows + recipe + collection + output template + burnable rows
    → craft() unsent mint + input actions   [tested]
    → signed burn or treasury transfer      [not in this repo]
    → signed mint of outputsTemplateId      [not in this repo]
```

## Related

- [px-blend-hybrid-ft-plus-nft](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft)
- [px-blend-schema-wildcard-recipes](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes)

## Run

```bash
npm test
```

MIT — Pixel Journey
