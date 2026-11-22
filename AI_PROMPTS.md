# AI handoff — simple NFT→NFT blend

## Agent tooling

```bash
git clone https://github.com/wharfkit/skill.git ~/.claude/skills/wharfkit
# AtomicAssets skills: https://github.com/atomicassets/atomic-knowledge (pin commit, AGENTS.md)
```

| Tool | Role |
| --- | --- |
| [atomic-knowledge](https://github.com/atomicassets/atomic-knowledge) | Network, mint order, market flow |
| [atomicassets-sdk](https://github.com/atomicassets/atomicassets-sdk) | Official TS client |
| [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) | mint / burn / transfer |
| [WAX blend tutorial](https://docs.wax.io/build/tutorials/howto_atomicassets/blend_nft) | Ingredient shape |
| [wharfkit/skill](https://github.com/wharfkit/skill) | SessionKit for a later host |

## Non-negotiables

1. Ingredients are a **multiset**. Order does not matter. One asset id cannot fill two slots.
2. Chain rows decide owner, template, collection, `burnable`, supply. A memo is not auth.
3. Burn (or treasury transfer) **before** mint, same transaction.
4. Batch cap in this lab is **20**.
5. Leave `tokens_to_back` empty unless a backed-mint design has its own tests.
6. Template id `-1` is the **wildcard** lab. FT legs are the **hybrid** lab (**PXJ precision is always 8** there).
7. Bodies stay unsent. `npm test` does not set `sent`.
8. Multiset match ports wherever AtomicAssets mint/burn exist. Account names and ABI version do not copy themselves.

## Prompt seeds

- "Two assets same template — can one id fill two slots?"
- "Show burn-before-mint order for a three-ingredient recipe."
- "Refuse burnable:false even if the collection author owns the asset."
- "Point at wildcard and hybrid labs without merging their rules."
- "Draft a host checklist with SessionKit; keep this pure lab offline."

## Do not

- Treat memo `blend:…` as authorization.
- Open a micro-repo for a renamed template id.
- Claim wasm or a live mint from this repo.
