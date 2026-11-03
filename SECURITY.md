# Security boundaries

Atlas Studio executes a limited local workflow language. It does not evaluate JavaScript, proxy requests, send notifications, connect an AI provider, or store credentials. HTTP behavior is selected from a fixed fixture enum. Condition operators are structured and payload paths reject prototype keys. React renders user content as text.

Zod validates versioned workspace loads and imports. Imports are limited to 5 MB and bounded record/node counts. Schema-invalid edits do not overwrite the last valid browser save. The graph validator rejects unsupported cycles, ambiguous entries, fan-out, missing paths, missing configuration, and invalid references before simulation. An invalid logical graph can be saved for editing; it cannot run until repaired.

Browser storage is origin-local and can be cleared by the visitor or browser. It is not encrypted storage for sensitive data. The intended inputs are fictional sample events. Exporting writes the current workspace to a visitor-selected download.

`netlify.toml` sets content, framing, permissions, and referrer policies. Storybook has a scoped inline-script allowance for its static boot configuration. The local assembled preview enforces the same CSP and tests Storybook under it. Confirm real provider headers after deployment.

Run `pnpm audit` to audit all dependencies and `pnpm audit --prod` for runtime packages. The lockfile pins installations. Root pnpm overrides use patched minimatch 11 and glob 14 to address development-tool advisories; ESLint 10, TypeScript tooling, Storybook builds, and tests are verified with those versions. Dependabot groups related updates so compatibility can be reviewed together.
