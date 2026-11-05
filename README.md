# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Quest:** 046 — simple NFT→NFT blend  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate with chain rows for **minter**, **output supply**, and **burnable ingredients** (burn disposition only). Unsent mint and input actions are returned. It does not mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm, **no** custody transfer.

## What is true (executed)

| Rule | Result |
| --- | --- |
| Exact templates + owner + minter + open output + burnable ingredient rows | `ok`, unsent `mintasset` and `burnasset` |
| Burn disposition without ingredient template rows | `not chain sourced` before any action body |
| Ingredient `burnable` is not true | `not burnable` |
| Ingredient row from the wrong collection | `wrong collection` |
| Partial unique template set | `not chain sourced` |
| Treasury disposition | unsent transfer; ingredient burn rows are not required |
| Missing collection or output template / full template | refused before any action body |

Chain rows are arguments with `source: "chain"`. Omitting them is not a live table read. Issued supply is not incremented.

## Live path, not shipped

```
owned assets + recipe + collection + output template + burnable rows
    → craft() unsent mint + input actions   [tested]
    → signed burn or treasury transfer      [not in this repo]
    → signed mint of outputsTemplateId      [not in this repo]
```

## Run

```bash
npm test
```

MIT — Pixel Journey
