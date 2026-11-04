# Template-exact NFT blend, without a live mint

> **Trust:** private educational lab (Tier B)  
> **Quest:** 046 — simple NFT→NFT blend  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate with a **chain collection row** for minter rights: the caller owns every ingredient, templates match, the caller is author or authorized, then unsent mint and input actions are returned. It does not mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm, **no** custody transfer.

## What is true (executed)

| Rule | Result |
| --- | --- |
| Exact templates + caller owns all three + chain minter row | `ok`, unsent `mintasset`, disposition actions |
| Missing collection row | `not chain sourced` before any action body |
| Caller neither author nor authorized | `not a minter` |
| Collection name ≠ recipe output collection | `wrong collection` |
| Author alone may mint | accepted without being in `authorized_accounts` |
| Burn disposition | three unsent `burnasset` bodies, `sent: false` |
| Treasury disposition | one unsent transfer, `sent: false` |
| Template mismatch / duplicate asset / non-owner | refused |

A chain row is an argument with `source: "chain"`. Omitting it is not a live `atomicassets::collections` read. Issued supply is not incremented.

## Live path, not shipped

```
owned assets + recipe + collection row
    → craft() unsent mint + input actions   [tested]
    → signed burn or treasury transfer      [not in this repo]
    → signed mint of outputsTemplateId      [not in this repo]
```

## Related

- `px-blend-hybrid-ft-plus-nft` — same idea plus a token leg and more chain-row gates
- Vault index: `px-contract-examples-vault`

## Run

```bash
npm test
```

MIT — Pixel Journey
