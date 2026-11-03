# Contributing

Use Node 22.22 and pnpm 10.10. Install with `pnpm install --frozen-lockfile`.

Keep domain code in `packages/core` free of React and browser dependencies. Validate external data in `packages/contracts`. Product and Storybook must share UI source rather than copy components. Any new node kind needs a contract, executor, validation, meaningful fixtures, UI configuration, and tests for its failure behavior.

Before submitting a change:

```sh
pnpm format
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Explain the concrete behavior changed, why it matters, and what you verified. Report accessibility and performance limits honestly. Do not add secrets, external runtime requirements, invented customer claims, or performance scores without measurements.
