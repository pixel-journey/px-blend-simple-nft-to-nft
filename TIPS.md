# Tips — template-exact NFT craft

## Do

- Treat **chain rows** as source of truth for owner, template, collection, burnable, and supply.
- Burn or treasury-transfer **before** mint, in one transaction.
- Record spent asset ids before another craft can reuse them.
- Match templates as a **multiset**. Ingredient order must not matter.
- Cap the batch (this lab: 20).
- Leave `tokens_to_back` empty unless you have a current backed-mint design and tests.

## Don't

- Trust `owner` or `template_id` from the memo alone.
- Let one asset id satisfy two crafts.
- Point the treasury account at the caller without a written custody policy.
- Treat these unit tests as proof of notify safety.

## Common mistakes

1. Minting the output, then failing the burn (output exists, inputs still in the wallet).
2. Using template `-1` here. Wildcards are [schema wildcard](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes).
3. Ignoring an FT ingredient. Hybrids are [hybrid blend](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft).
4. Assuming `burnable: false` can still be burned because the collection is yours.
5. Client-side "I own it" without `require_auth` of that owner.

## Product choices to write down

| Choice | Why |
| --- | --- |
| Burn vs treasury | Destroy vs keep for later |
| Who may craft | Owner vs collection account |
| Recipe storage | On-chain table vs signed hash |
| Partial failure | One atomic transaction, not a refund quest you have not written |

## Nice-to-have extensions (not in this repo)

| Idea | Note |
| --- | --- |
| Odds on the output | RNG after ingredients lock |
| Cooldown per wallet | [invariant kit](https://github.com/pixel-journey/px-invariant-kit) |
| Memo `blend:recipeId` | [memo router](https://github.com/pixel-journey/px-memo-action-router) |

Official: [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) · [blend tutorial](https://docs.wax.io/build/tutorials/howto_atomicassets/blend_nft).
