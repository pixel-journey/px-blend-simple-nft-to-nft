# Tips — NFT craft gates on WAX

## Do

- Read **asset**, **template**, and **collection** rows on contract (or trust only your own prior action in the same tx).
- Match **template_id** exactly unless you intentionally use a wildcard lab.
- Record spent asset ids in a table before relying on “burn succeeded.”
- Keep mint and input disposition in one atomic action path where possible.

## Don’t

- Trust `owner` from the client memo or JSON.
- Allow the same asset id to satisfy two crafts.
- Use `backasset` as a general reward channel (v2 removed casual backing patterns).

## Related

| Lab | Role |
| --- | --- |
| [hybrid FT+NFT](https://github.com/pixel-journey/px-blend-hybrid-ft-plus-nft) | Token + NFT inputs |
| [schema wildcard](https://github.com/pixel-journey/px-blend-schema-wildcard-recipes) | Non-exact template match |
| [memo router](https://github.com/pixel-journey/px-memo-action-router) | `blend:recipe-id` grammar |
| [atomicassets-contract](https://github.com/pinknetworkx/atomicassets-contract) | mint / burn / transfer |
