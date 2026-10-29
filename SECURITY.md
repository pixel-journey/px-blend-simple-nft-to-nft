# Security notes

| Issue | Lab mitigation |
|-------|----------------|
| Craft with others' NFTs | owner check per ingredient |
| Wrong templates | multiset equality |
| Double-count same asset | duplicate asset id refused |

Production needs real custody transfer/burn, atomic mint, and reentrancy-safe notify ordering.
