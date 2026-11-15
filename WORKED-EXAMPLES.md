# Worked examples — template-exact NFT blend

Recipe under test: requires templates **1001, 1001, 1002** → mint template **2000**. Collection `examplecol` / schema `examplesch`. Ingredients from `ingcol`.

## Happy path (burn)

Three chain assets owned by alice, matching templates, burnable ingredient rows, minter authorized or author:

- `consumedAssetIds` length **3**
- unsent **burnasset** ×3 then unsent **mintasset** (actions length 4)
- burns ordered by asset id strings `1`, `2`, `3` when offered out of order
- mint has **no** `asset_id`; `tokens_to_back` is `[]`

## Treasury disposition

`inputDisposition: "treasury"`, `treasury: "treas.pxj"`:

- `burns` null; one unsent **transfer** then mint (actions length 2)
- ingredient burnable rows not required
- missing treasury / treasury == caller refused

## Composition desk

Pure `craft()` accepts the **same** ids twice (no persisted state).

Desk records consumed ids: second craft of `10,20` → `asset already consumed`. Fresh ids `11,12` then `21,22` → desk.consumed size **4**.

## Supply and auth

| Case | Result |
| --- | --- |
| max_supply 10, issued 9 | ok |
| max_supply 5, issued 5 | template full |
| caller not author/authorized | not a minter |
| output template id 9999 | template mismatch |
| wrong schema | wrong schema |

## Ingredient refusals (before any action body)

Non-owner (claim or chain row), wrong collection, template mismatch, duplicate asset id, empty recipe, batch **21** (cap 20), asset id > uint64 max, missing chain rows, non-burnable on burn path.

Batch of exactly **20** ingredients accepted. Asset id at uint64 max accepted.

**TypeScript tests are the rule**; production must persist burns like the desk.
