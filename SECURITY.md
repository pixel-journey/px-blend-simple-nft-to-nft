# Security — blend craft gate

## Closed in tests

| Issue | Behavior |
| --- | --- |
| Client-only owner claim | Chain asset `owner` must match caller |
| Wrong / missing chain rows | refused before action bodies |
| Burn without burnable template | refused |
| Unauthorized minter | refused |
| Full output template | refused |
| Duplicate asset id | refused |
| Batch > **20** | refused |
| Asset id > uint64 | refused |
| Pure-function replay of ids | composition **desk** marks consumed |
| Treasury == caller / missing | refused |

Match **template counts**, not a single asset id. Burns before mint in the returned action list; all unsent.

## Not closed (production)

| Concern | Guidance |
| --- | --- |
| Notify / transfer-in | Accept only assets sent to the blend contract; ignore wrong `first_receiver` |
| Real `require_auth` | String equality in tests is not a signature |
| Ordering / reentrancy | Consume inputs before mint; single-tx preferred |
| Supply race | Re-read template supply in the minting action |
| RAM payer | Who pays for recipe and consumption tables |
| Partial failure | Burn without mint needs an explicit recovery story |
| Broadcast | `sent: false` is not an on-chain transfer |

## Attack angles

1. Matching a single asset id instead of recipe template counts.  
2. Trusting client-supplied owner/template without chain rows.  
3. Minting before burns in a multi-tx path (user keeps inputs + output).  
4. Calling a debited desk "done" while every action is still unsent.  
5. Wildcard greed — see [schema wildcard](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes) (exact-before-wildcard).

## Honesty limits

No AtomicAssets RPC, no broadcast.

| Sibling | Distinction |
| --- | --- |
| [wildcard recipes](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes) | Exact-before-wildcard matching |
| [hybrid FT+NFT](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft) | Token + NFT inputs |
| [memo router](https://github.com/pixel-journey/px-memo-action-router) | Structured memos |

[atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) · [docs.wax.io AtomicAssets](https://docs.wax.io/build/tutorials/howto_atomicassets).
