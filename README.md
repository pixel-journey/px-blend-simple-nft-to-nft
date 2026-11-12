# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Domain:** AtomicAssets craft / blend  
> **Sources:** [SOURCES.md](SOURCES.md)  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate. Ownership is a **chain asset row**, not the client `owner` field. Minter, output supply, and burnable ingredient rows are also chain rows. Unsent mint and input actions are returned. It does not mint.

**Real code:** `npm test` (unit + **sequential composition**). **No** AtomicAssets call, **no** wasm, **no** custody transfer.

Official contract: [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract). WAX guides: [How-To AtomicAssets](https://docs.wax.io/build/tutorials/howto_atomicassets), [Minting NFTs](https://docs.wax.io/build/tutorials/howto_atomicassets/mint_nft).

## Composition note

`craft()` is pure: calling it twice with the same asset ids both return `ok`. Production must record burns/transfers so spent ids cannot be reused. `blend.composition.test.ts` models that desk and refuses `asset already consumed`.

## What is true (executed)

| Rule | Result |
| --- | --- |
| Exact templates + chain asset owner + minter + open output + burnable rows | `ok`, unsent `mintasset` and `burnasset` |
| Missing / wrong chain rows | refused before any action body |
| Burn disposition without burnable rows | refused |
| Treasury disposition | unsent transfer; burnable rows not required |
| Sequential desk | second craft of same ids refused |

## AtomicAssets v2

`mint.tokens_to_back` is always `[]`. See [ATOMICASSETS-V2.md](https://github.com/pixel-journey/wax-ecosystem-blueprint-catalog/blob/main/ATOMICASSETS-V2.md).

## Related

- [px-blend-hybrid-ft-plus-nft](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft)
- [px-blend-schema-wildcard-recipes](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes)

## Run

```bash
npm test
```

MIT — Pixel Journey
