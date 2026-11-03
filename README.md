# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Quest:** 046 — simple NFT→NFT blend  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate: the caller owns every ingredient, the template multiset matches, then the function returns an **unsent mintasset** plus **unsent** burn or treasury transfer bodies for the inputs. It does not mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm, **no** custody transfer.

## What is true (executed)

Sample recipe `pebble-to-rock` requires templates `[1001, 1001, 1002]` and outputs template `2000` in collection `examplecol` / schema `examplesch` with disposition `burn`.

| Rule | Result |
| --- | --- |
| Exact templates + caller owns all three | `ok`, `mintTemplateId` 2000, three consumed ids, disposition `burn` |
| Output | one unsent `atomicassets::mintasset` with no asset id, `sent: false` |
| Burn disposition | three unsent `atomicassets::burnasset` bodies, ordered by asset id, `sent: false` |
| Treasury disposition | one unsent `atomicassets::transfer` to `recipe.treasury`, `sent: false` |
| Bad output collection or schema name | refused before any action body |
| Treasury missing or equal to caller | refused before any action body |
| One ingredient owned by someone else | `not owner of ingredient` |
| A template id that is not in the recipe | `template mismatch` |
| The same asset id listed twice | `duplicate asset` |

`examplecol`, `examplesch`, and `treas.pxj` are example names, not a live claim. Issued supply is not incremented.

## The rule, in order

`craft(recipe, ingredients, caller)`:

1. Caller and every owner must be an Antelope name.
2. Recipe id, disposition, output template, collection, and schema are validated.
3. Ingredient count must equal `recipe.requires.length`.
4. Each `assetId` is a `bigint` ≥ 1 and appears once.
5. Every ingredient owner equals `caller`.
6. Template counts match exactly (multiset).
7. On success: unsent `mintasset` for the output; for `burn`, unsent `burnasset` per id; for `treasury`, unsent transfer of all ids. Nothing is burned, transferred, or minted.

## Live path, not shipped

```
owned assets + recipe
    → craft() unsent mint + input actions   [tested]
    → signed burn or treasury transfer      [not in this repo]
    → signed mint of outputsTemplateId      [not in this repo]
```

## Related

- `px-blend-hybrid-ft-plus-nft` — same idea plus a token leg and chain-row gates
- Vault index: `px-contract-examples-vault`

## Run

```bash
npm test
```

MIT — Pixel Journey
