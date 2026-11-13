# Security notes — blend craft gate

## Mitigated in the lab

| Issue | Behavior |
| --- | --- |
| Client-supplied owner | ownership from chain asset row only |
| Wrong / missing templates | refused |
| Burn without burnable | refused |
| Unauthorized minter | refused |
| Pure craft replay | composition desk marks consumed |

## Production still needs

| Concern | Guidance |
| --- | --- |
| Notify / transfer in | Only accept assets sent to the blend contract |
| Auth | `require_auth(blender)` + collection mint auth |
| Reentrancy / ordering | Burn or lock inputs before mint output |
| RAM | Payer for any recipe / consumption tables |
| Supply race | Re-check template max supply in the same action |

This repository does not call AtomicAssets RPC and does not broadcast.
