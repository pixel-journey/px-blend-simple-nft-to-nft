# Tips — template-exact craft on WAX

## Do

- Treat **chain rows** as source of truth for owner, template, collection, burnable, and supply.
- Keep **burn/transfer before mint** in one atomic path when possible.
- Record spent asset ids in a table (desk pattern) before allowing another craft.
- Use multiset counts; do not rely on ingredient array order.
- Cap batch size (this lab: 20) to bound CPU/RAM.
- Leave `tokens_to_back` empty unless you intentionally use a backed-mint design with current AA rules.

## Don't

- Trust `owner` or `template_id` from the client memo alone.
- Allow the same asset id to satisfy two crafts after the first succeeded on chain.
- Point treasury at the caller or the blend contract without a clear custody policy.
- Assume pure unit tests prove notify/custody safety.

## Design choices to document for your product

| Choice | Why it matters |
| --- | --- |
| Burn vs treasury | Burn destroys; treasury preserves for later ops |
| Who may craft | Owner only vs collection-authorized minter |
| Recipe storage | On-chain table vs off-chain verified hash |
| Failure after partial burn | Atomic tx vs multi-step + refund |

## Related

[hybrid FT+NFT](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft) · [wildcard](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes) · [memo router](https://github.com/pixel-journey/px-memo-action-router) · [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract)
