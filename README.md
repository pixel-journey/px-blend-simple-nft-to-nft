# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Quest:** 046 — simple NFT→NFT blend  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate: the caller owns every ingredient, the template multiset matches, then the function returns a **mint intent** plus a burn or treasury disposition. It does not mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm, **no** custody transfer.

## What you can learn

- Why a recipe is a **multiset** of template ids (counts matter, order does not).
- Why ownership is checked on every ingredient, not only the first.
- Why the same asset id cannot be listed twice to fake a second template.
- Why this lab returns an intent instead of claiming a mint.

## What is actually in the repo

| Piece | Role |
| --- | --- |
| `invariants/blend.ts` | `craft` — name checks, owner, multiset, mint intent |
| `invariants/blend.test.ts` | Executed claims |
| `EDUCATION.md` | The four-step pattern |
| `SECURITY.md` | What production still has to do |

## What is true (executed)

Sample recipe `pebble-to-rock` requires templates `[1001, 1001, 1002]` and outputs template `2000` with disposition `burn`.

| Rule | Result |
| --- | --- |
| Exact templates + caller owns all three | `ok`, `mintTemplateId` 2000, three consumed ids, disposition `burn` |
| One ingredient owned by someone else | `not owner of ingredient` |
| A template id that is not in the recipe | `template mismatch` |
| The same asset id listed twice | `duplicate asset` |

Order of the three ingredients does not matter. Count does. Two `1001` and one `1002` matches. Three `1001` does not.

## The rule, in order

`craft(recipe, ingredients, caller)`:

1. Caller and every owner must be an Antelope name (`a-z`, `1-5`, `.`, length 1–12, no leading, trailing, or doubled-dot handling beyond the regex plus edge dots).
2. Recipe id is non-empty and at most 32 characters. Disposition is `burn` or `treasury`. Output template id is an integer ≥ 1.
3. Ingredient count must equal `recipe.requires.length`.
4. Each `assetId` is a `bigint` ≥ 1 and appears once.
5. Every ingredient owner equals `caller`.
6. Template counts match exactly (multiset). A wrong id or a wrong count throws `template mismatch`.
7. On success the return is an intent: consumed ids, disposition, `mintTemplateId`, and `minter` (the caller). Nothing is burned or minted.

```ts
import { craft } from "./invariants/blend.ts";

const result = craft(
  {
    id: "pebble-to-rock",
    requires: [1001, 1001, 1002],
    outputsTemplateId: 2000,
    inputDisposition: "burn",
  },
  [
    { assetId: 1n, templateId: 1001, owner: "alice" },
    { assetId: 2n, templateId: 1002, owner: "alice" },
    { assetId: 3n, templateId: 1001, owner: "alice" },
  ],
  "alice"
);
// result.mintTemplateId === 2000; result.disposition === "burn"
```

## Edge cases

- Ingredient count shorter or longer than `requires` throws before the multiset compare.
- Template ids below 1 throw `bad template id`.
- A non-bigint or non-positive asset id throws `bad asset id`.
- `burn` and `treasury` are labels on the intent. Neither moves an NFT in this file.
- Account names that fail the charset are rejected. That is a format check, not a proof the account exists.

## Best practice and the opposite

**Do** match templates by count, not by array order.  
**Do** refuse a duplicate asset id even when both rows name the same template.  
**Do** keep the mint as a separate step the contract actually authorizes.

**Do not** treat `ok: true` as an AtomicAssets mint.  
**Do not** let the client pick the output template independently of the recipe. The output id comes from the recipe object.

## Live path, not shipped

```
owned assets + recipe
    → craft() intent          [tested]
    → burn or treasury transfer of inputs   [not in this repo]
    → atomic mint of outputsTemplateId      [not in this repo]
```

Production still needs real custody transfer or burn, an atomic mint, and notify ordering that cannot re-enter the craft. See [SECURITY.md](SECURITY.md).

## Related

- `px-blend-hybrid-ft-plus-nft` — same idea plus a token leg
- Vault index: `px-contract-examples-vault`

## Run

```bash
npm test
```

MIT — Pixel Journey
