# Template-exact NFT blend (craft gate)

> **Domain:** AtomicAssets craft / blend  
> **Sources:** [SOURCES.md](SOURCES.md)  
> **Catalog:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**Goal:** A **template-exact** craft gate. Ownership is a **chain asset row**, not a client-supplied `owner` field. Returns unsent mint and input action bodies — does not mint on chain.

**Code under test:** `npm test` (unit + sequential composition).

**Official:** [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract). **Guides:** [How-To AtomicAssets](https://docs.wax.io/build/tutorials/howto_atomicassets), [Minting NFTs](https://docs.wax.io/build/tutorials/howto_atomicassets/mint_nft).

## Learning materials

| Doc | Role |
| --- | --- |
| [EDUCATION.md](EDUCATION.md) | Beginner → masterclass |
| [WORKED-EXAMPLES.md](WORKED-EXAMPLES.md) | Happy path, refusals, consumed desk |
| [TIPS.md](TIPS.md) | Custody and recipe design |
| [SECURITY.md](SECURITY.md) | Ownership and replay |
| [SOURCES.md](SOURCES.md) | Official + related blends |

## Composition

`craft()` is pure; the composition **desk** refuses `asset already consumed` on the second use of the same ids.

## What is true (executed)

| Rule | Result |
| --- | --- |
| Exact templates + chain owner + minter + open output + burnable | `ok`, unsent mint/burn |
| Missing / wrong chain rows | refused |
| Burn without burnable | refused |
| Treasury disposition | unsent transfer |
| Sequential desk | second craft refused |

`mint.tokens_to_back` is always `[]` (AtomicAssets v2).

```bash
npm test
```

MIT — Pixel Journey
