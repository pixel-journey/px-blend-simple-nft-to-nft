# px-blend-simple-nft-to-nft

> **Trust:** private educational lab (Tier B)  
> **Quest:** 046 — simple NFT→NFT blend  
> **Vault:** [px-contract-examples-vault](https://github.com/pixel-journey/px-contract-examples-vault)

**One-sentence goal:** Teach a **template-exact** craft gate: caller owns every ingredient, multiset matches, then emit a **mint intent** and burn/treasury disposition — without claiming a live mint.

**Real code:** `npm test`. **No** AtomicAssets call, **no** wasm.

---

## What is true (executed)

| Rule | Result |
|------|--------|
| Exact templates + owner | craft ok + mint template id |
| Non-owner ingredient | refused |
| Wrong template | refused |
| Duplicate asset id | refused |

```bash
npm test
```

Neighbor: `px-blend-hybrid-ft-plus-nft`.

## License

MIT — Pixel Journey
