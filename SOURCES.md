# Sources

## Official

| Source | Use |
| --- | --- |
| [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) | `mintasset`, `burnasset`, `transfer`, template/collection tables |
| [Blend tutorial](https://docs.wax.io/build/tutorials/howto_atomicassets/blend_nft) | Ingredient and output shape |
| [WAX How-To AtomicAssets](https://docs.wax.io/build/tutorials/howto_atomicassets) | Standard overview |
| [Minting NFTs](https://docs.wax.io/build/tutorials/howto_atomicassets/mint_nft) | Mint parameters |
| [docs.wax.io](https://docs.wax.io/) | Auth, RAM, notifications |

## Product facts locked by this lab

- Match templates as a **multiset**. Ingredient order does not matter. One asset id cannot satisfy two slots.
- Chain rows are the source of truth for owner, template, collection, `burnable`, and supply. A memo is not.
- Burn (or treasury transfer) **before** mint, in one transaction.
- Batch cap in this lab is **20**.
- Leave `tokens_to_back` empty unless a backed-mint design has its own tests.
- Template id **`-1`** is not this lab. That is [schema wildcard](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes).
- An FT leg is not this lab. That is [hybrid blend](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft). **PXJ precision is always 8** there.
- `burnable: false` cannot be burned because you own the collection.

Bodies stay unsent. `npm test` does not flip `sent`.

## Pixel Journey

| Source | Use |
| --- | --- |
| [ATOMICASSETS-V2.md](https://github.com/pixel-journey/wax-ecosystem-blueprint-catalog/blob/main/ATOMICASSETS-V2.md) | v2 notes, empty `tokens_to_back` |
| [learning path](https://github.com/pixel-journey/px-contract-examples-vault/blob/main/docs/LEARNING-PATH.md) | Curriculum index |

## Related labs

| Lab | Topic |
| --- | --- |
| [schema wildcard](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes) | `template_id: -1` slots |
| [hybrid blend](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft) | PXJ@8 + NFT craft |
| [memo router](https://github.com/pixel-journey/px-memo-action-router) | `blend:recipe-id` is grammar, not auth |
| [safe partial updater](https://github.com/pixel-journey/px-aa-mutable-safe-partial-updater) | Mutable data without a wipe |
