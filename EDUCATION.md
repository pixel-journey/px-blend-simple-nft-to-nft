# Education — template-exact NFT craft

> **Rung:** `npm test` passes. `craft` returns a mint **intent**. It does not burn, transfer, or mint.  
> **The test is the rule.**

## What you should be able to do

| Level | After this file |
| --- | --- |
| Beginner | Match a recipe that needs two of one template and one of another |
| Intermediate | Say why asset ids are a set, and why one bob-owned ingredient fails the whole craft |
| Masterclass | List the AtomicAssets actions this intent still has to become |

---

## Beginner — one scene

Recipe `pebble-to-rock` wants template ids `1001`, `1001`, and `1002`. The output template is `2000`. Inputs are marked `burn`. Alice owns assets `1`, `2`, and `3` with those templates. `craft` returns:

| Field | Value the test checks |
| --- | --- |
| `ok` | true |
| `mintTemplateId` | 2000 |
| `consumedAssetIds` length | 3 |
| `disposition` | `burn` |

If asset `2` is owned by `bob`, the call throws `not owner of ingredient`. If asset `3` is template `9999`, it throws `template mismatch`. If assets `1` and `1` are both submitted, it throws `duplicate asset`.

### Words

| Word | Meaning here |
| --- | --- |
| Recipe | Id, required template ids, output template, disposition |
| Multiset | Counts matter, order does not. Two `1001` is not one `1001` |
| Ingredient | An asset id, a template id, and an owner string |
| Disposition | `burn` or `treasury` on the recipe. The test uses `burn` only |
| Mint intent | A return value naming the output template and the minter. Not a transaction |

### Predict, then run

```bash
npm test
```

1. Can Alice craft if she owns the right templates but one asset id is repeated? (No.)
2. Does the success result include a transaction id? (No. It includes consumed ids and a mint template.)
3. Who is `minter` on success? (The caller, `alice`.)

---

## Intermediate — counts, not positions

`craft` first checks the caller name, recipe id length 1..32, disposition, output template ≥ 1, and `ingredients.length === requires.length`.

Then each ingredient: asset id is a positive `bigint`, ids are unique, owner name is well-formed, owner equals caller.

Then it builds two maps of template id → count. They must be equal. `[1001, 1002, 1001]` against the recipe's `[1001, 1001, 1002]` matches. The tests pass ingredients in recipe order, so they do not lock the swapped order. The source does. Do not describe the test as an order test.

A length mismatch throws `ingredient count mismatch` before the map compare. The tests do not call that path. A wrong template at the same length throws `template mismatch`, which is what the test locks.

`inputDisposition: "treasury"` is a legal recipe value. No test crafts with it. The result would still only be an intent whose `disposition` field copies the recipe.

### Attack → test

| Attack | Naive code | This lab | Test |
| --- | --- | --- | --- |
| Use someone else's NFT in the bundle | You burn their asset | `not owner of ingredient` | `refuses non-owner ingredient` |
| Substitute a lookalike template | You mint the prize | `template mismatch` | `refuses template mismatch` |
| Pass the same asset twice | One NFT counts as two | `duplicate asset` | `refuses duplicate asset ids` |
| Happy path | — | intent, not a mint | `accepts exact multiset and owner` |

---

## Masterclass — an intent is not a blend contract

AtomicAssets will not read this return value. A real craft, in one transaction, still has to:

1. Load each asset row. Owner and template come from the table, not from action arguments. This lab trusts `Ingredient.owner` and `Ingredient.templateId`.
2. `require_auth` of that owner. A string compare is what the test does.
3. Burn (`burnasset`) or transfer to the treasury account, using action names that are constants.
4. Mint the output to the caller only after the inputs are consumed, and only if this contract is an authorized minter for the collection.
5. Refuse a recipe whose output template is not in the collection you think it is.

If step 3 succeeds and step 4 fails, you destroyed inputs with no prize. The intent object cannot roll that back because it never sent anything. Sketch the failure as one transaction or as an explicit two-step with a refund path. This repo has neither.

`px-blend-hybrid-ft-plus-nft` is the neighbor that also debits a fungible amount. Do not assume this multiset check covers a token leg. It does not look at quantities at all.

### Exercise

1. Recipe requires `[1001, 1001]`. Ingredients are template `1001` twice, different asset ids, both owned by the caller. Does the length check pass? (Yes.) Does the map check pass? (Yes. Derived. The test uses three ingredients.)
2. Same assets, but the caller argument is `bob` while owners are `alice`. Result? (`not owner of ingredient`.)
3. Which of burn, treasury transfer, and mint does `npm test` perform? (None. It checks the intent's `disposition` string is `burn`.)

---

## What this course will not teach

- A live blend or a collection authority
- That the treasury disposition has a test (it does not)
- That ingredient order is what the test asserts (the source compares counts)
