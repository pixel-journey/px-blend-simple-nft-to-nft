# Education — template-exact NFT craft

> **Rung:** `npm test` passes. `craft` returns **unsent** AtomicAssets action bodies. It does not broadcast.  
> **The test is the rule.** Ownership and burnability come from **chain rows**, not client claims alone.

## Learning outcomes

| Level | After this file |
| --- | --- |
| Beginner | Match a multiset recipe (two of template A, one of B) and list what a success object contains |
| Intermediate | Explain burn vs treasury disposition, action order, and why client `owner` is not enough |
| Masterclass | Describe the composition desk, supply races, and what production still must add |

Related stack: [wildcard slots](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes) · [hybrid FT+NFT](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft) · [memo `blend:`](https://github.com/pixel-journey/px-memo-action-router).

Official: [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) · [WAX AtomicAssets how-to](https://docs.wax.io/build/tutorials/howto_atomicassets).

---

## Beginner — one scene

Recipe `pebble-to-rock` requires template ids **1001, 1001, 1002** (a **multiset**: counts matter, order of the array does not). Output template **2000**, disposition **burn**.

Alice owns three chain assets with those templates. `craft` succeeds when:

1. Collection + output template + ingredient templates + asset rows are all `source: "chain"`.
2. Each asset’s chain **owner** is the caller.
3. Ingredient templates are **burnable** (burn path).
4. Caller is collection **author** or in `authorized_accounts`.
5. Output template has remaining supply (or unlimited `max_supply: 0`).

Success includes:

| Field | Test-backed meaning |
| --- | --- |
| `ok` | true |
| `mintTemplateId` | 2000 |
| `consumedAssetIds` | three ids |
| `disposition` | `burn` |
| `actions` | three unsent `burnasset` then one unsent `mintasset` |
| `mint.data.tokens_to_back` | always `[]` (AtomicAssets v2) |

### Words

| Word | Meaning here |
| --- | --- |
| Multiset | Two `1001` is not one `1001`; maps of template→count must match |
| Chain row | Asset / template / collection object with `source: "chain"` |
| Disposition | `burn` (destroy inputs) or `treasury` (transfer inputs to a sink account) |
| Unsent | Action body for teaching; `sent: false` — not broadcast |
| Desk | Composition wrapper that records consumed asset ids across crafts |

### Predict, then run

```bash
npm test
```

1. Same asset id twice → `duplicate`.
2. Bob owns one ingredient on the chain row → `not the owner` / `not owner`.
3. Does success include a transaction id? **No.**

Numbers: [WORKED-EXAMPLES.md](WORKED-EXAMPLES.md).

---

## Intermediate — disposition, order, and gates

### Burn path

Ingredient template rows are required and each matching template must be **burnable**. Actions: `burnasset` × N, then `mintasset`. Burns are ordered by the consumed id list the implementation produces (tests lock ids `1`,`2`,`3` after an out-of-order offer).

### Treasury path

`inputDisposition: "treasury"` with `treasury: "treas.pxj"`:

- No ingredient burn rows required.
- Actions: one unsent **transfer** of the asset bundle to treasury, then mint.
- Missing treasury account or treasury == caller refused.

### Auth and supply

| Gate | Refusal |
| --- | --- |
| Caller not author and not authorized | not a minter |
| Output template id ≠ recipe | template mismatch |
| Wrong schema name | wrong schema |
| issued_supply == max_supply (>0) | template full |
| max_supply 10, issued 9 | allowed |

### Batch bounds

Exactly **20** ingredients accepted. **21** → `bad asset batch`. Asset id at uint64 max accepted; one past max refused before bodies.

### Attack → test

| Attack | Lab behavior |
| --- | --- |
| Client lies about owner | Chain asset row owner wins |
| Lookalike template | template mismatch |
| Same asset twice | duplicate |
| Non-burnable on burn path | not burnable |
| Replay same ids | pure craft allows; **desk** throws already consumed |

---

## Masterclass — intent vs production blend

AtomicAssets will not execute these objects by themselves. A live craft in **one transaction** still must:

1. Load asset / template / collection rows inside the contract (or trust only state written in the same tx).
2. `require_auth` of the blender; verify mint authority on the collection.
3. **Consume inputs before mint** (burn or transfer). If mint fails after burn, inputs are gone — design atomicity or an explicit refund path.
4. Re-check template `issued_supply` / `max_supply` in the same action (supply race).
5. Persist spent asset ids (the composition **desk** is the teaching stand-in).

Pure `craft()` is intentionally **stateless**: the same ids succeed twice. That is not a product bug in the pure function; it is why the desk exists and why production tables exist.

This lab does **not** handle FT legs, schema wildcards, or notify-based deposits. Those are sibling repos.

### Exercises

1. Recipe `[1001, 1001]`, two different assets both template 1001, same owner — length and multiset both pass.  
2. Caller `bob`, chain owners `alice` — refused.  
3. List every action name in a successful burn craft — three `burnasset`, one `mintasset`, all `sent: false`.

---

## What this course will not teach

- Live AtomicAssets RPC or broadcast
- Collection setup / schema format design beyond ids used in tests
- Hybrid FT debit (see hybrid lab)
- Wildcard `template_id: -1` matching (see wildcard lab)
