# Worked examples — template-exact blend

Ownership and burnability come from **chain rows**, not client-supplied owner fields.

## Example A — happy path (burn disposition)

Ingredients match required templates, assets owned by blender, templates burnable, output template open, minter authorized → `ok` with **unsent** `mintasset` + `burnasset` bodies.

## Example B — treasury disposition

Same gate, but inputs transfer to treasury instead of burn → unsent **transfer** bodies; burnable flag not required.

## Example C — refused before any action body

| Failure | Result |
| --- | --- |
| Wrong template id | refused |
| Asset not owned by blender (chain row) | refused |
| Missing asset row | refused |
| Burn disposition + non-burnable template | refused |
| Output supply closed / maxed | refused |
| Minter not authorized | refused |

## Example D — sequential desk (composition)

`craft()` pure function returns `ok` twice with same ids. **Desk** records consumed ids and refuses `asset already consumed` on the second craft. Production must persist burns/transfers the same way.

## Example E — AtomicAssets v2

`mint.tokens_to_back` is always `[]`. See [ATOMICASSETS-V2.md](https://github.com/pixel-journey/wax-ecosystem-blueprint-catalog/blob/main/ATOMICASSETS-V2.md).
