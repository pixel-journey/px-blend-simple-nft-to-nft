# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Quest:** 046 — simple NFT→NFT blend  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate with **chain collection and output-template rows**: ownership, multiset, minter rights, and supply room must all pass before unsent mint and input actions are returned. It does not mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm, **no** custody transfer.

## What is true (executed)

| Rule | Result |
| --- | --- |
| Exact templates + owner + chain minter + open output template | `ok`, unsent `mintasset`, disposition actions |
| Missing collection or output template row | `not chain sourced` before any action body |
| Caller neither author nor authorized | `not a minter` |
| Wrong collection / schema / template id on the output row | refused |
| `issued_supply >= max_supply` (when max_supply ≠ 0) | `template full` |
| `max_supply` 0 | unlimited; accepted |
| Burn / treasury disposition | unsent action bodies only |

Chain rows are arguments with `source: "chain"`. Omitting them is not a live table read. Issued supply is not incremented.

## Live path, not shipped

```
owned assets + recipe + collection + output template
    → craft() unsent mint + input actions   [tested]
    → signed burn or treasury transfer      [not in this repo]
    → signed mint of outputsTemplateId      [not in this repo]
```

## Related

- `px-blend-hybrid-ft-plus-nft` — same idea plus a token leg and burnable ingredient rows
- Vault index: `px-contract-examples-vault`

## Run

```bash
npm test
```

MIT — Pixel Journey
