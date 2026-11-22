# Sources

## Official

| Source | Use |
| --- | --- |
| [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) | `mintasset`, `burnasset`, `transfer`, template/collection tables |
| [Blend tutorial](https://docs.wax.io/build/tutorials/howto_atomicassets/blend_nft) | Ingredient and output shape |
| [WAX How-To AtomicAssets](https://docs.wax.io/build/tutorials/howto_atomicassets) | Standard overview |
| [Minting NFTs](https://docs.wax.io/build/tutorials/howto_atomicassets/mint_nft) | Mint parameters |
| [atomicassets-sdk](https://github.com/atomicassets/atomicassets-sdk) | Official TS client |
| [atomic-knowledge](https://github.com/atomicassets/atomic-knowledge) | Skills + network-before-action |
| [wharfkit/skill](https://github.com/wharfkit/skill) | SessionKit if a host signs |
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

## Portability

Multiset match, burn-before-mint, and “memo is not auth” port to any Antelope deployment that hosts AtomicAssets-style mint/burn. Swap collection names, template ids, and chain endpoints. Do not assume WAX mainnet ABI equals WAX testnet V2.

## Pixel Journey

| Source | Use |
| --- | --- |
| [ANTELOPE-PORTABILITY.md](https://github.com/pixel-journey/px-contract-examples-vault/blob/main/docs/ANTELOPE-PORTABILITY.md) | Shared vs chain-local |
| [AGENT-TOOLING.md](https://github.com/pixel-journey/px-contract-examples-vault/blob/main/docs/AGENT-TOOLING.md) | Skills vs MCPs |
| [learning path](https://github.com/pixel-journey/px-contract-examples-vault/blob/main/docs/LEARNING-PATH.md) | Curriculum index |

## Related labs

| Lab | Topic |
| --- | --- |
| [schema wildcard](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes) | `template_id: -1` slots |
| [hybrid blend](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft) | PXJ@8 + NFT craft |
| [memo router](https://github.com/pixel-journey/px-memo-action-router) | `blend:recipe-id` is grammar, not auth |
| [safe partial updater](https://github.com/pixel-journey/px-aa-mutable-safe-partial-updater) | Mutable data without a wipe |
