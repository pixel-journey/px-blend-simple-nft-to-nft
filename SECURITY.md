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
| Batch > 20 | refused |
| Asset id > uint64 | refused |
| Pure-function replay of ids | composition **desk** marks consumed |
| Treasury == caller / missing | refused |

## Not closed (production)

| Concern | Guidance |
| --- | --- |
| Notify / transfer-in | Accept only assets sent to the blend contract; ignore wrong `first_receiver` |
| Real `require_auth` | String equality in tests is not a signature |
| Ordering / reentrancy | Consume inputs before mint; single-tx preferred |
| Supply race | Re-read template supply in the minting action |
| RAM payer | Who pays for recipe and consumption tables |
| Partial failure | Burn without mint needs an explicit recovery story |

This repository does not call AtomicAssets RPC and does not broadcast.
