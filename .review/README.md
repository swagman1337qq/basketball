# Review regression checks

Use Node 24 or newer from the repository root:

```sh
node .review/regressions.mjs
node .review/reproduce.mjs
```

The regression runner asserts the requested fixes. The original reproductions record whether each old defect is still observed; F01, F07, F13 and F15 intentionally remain observable. Tests transform TypeScript with Node's built-in transform and stub only React's createElement; simulation and contract code run unchanged. Generated runtime folders and temporary toolchain downloads are ignored.
