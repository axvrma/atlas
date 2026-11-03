# Netlify deployment

No deployment, GitHub push, remote repository creation, DNS change, or account configuration is performed by the local implementation.

1. Publish the repository yourself, then create one Netlify site from that Git repository.
2. Use repository root as base. `netlify.toml` specifies build command `corepack enable && pnpm install --frozen-lockfile && pnpm build` and publish directory `dist`.
3. Pin Node 22.22.0 (also in `.nvmrc`) and pnpm 10.10.0. No application environment variables, API keys, database, or authentication are required.
4. Deploy and verify `/`, `/app/workflows/support-triage`, `/app/executions/seed-0001`, every engineering page, `/benchmarks`, and `/storybook/`. Refresh each directly.
5. In Netlify Domain management, add `atlas.axvrma.com`. Follow the DNS target Netlify returns for this specific site. At the authoritative DNS provider create the requested CNAME/records; do not guess a Netlify hostname. Wait for validation and TLS issuance, then set it as primary domain.

The root build runs benchmarks, builds web and Storybook independently with Turborepo, and combines them into `dist/`. Storybook Vite assets are relative to the Storybook document and the manager's own static assets remain under the same directory. Let Netlify's directory-index / Pretty URLs handling resolve `/storybook` and `/storybook/`; do not add a custom redirect between them. Netlify normalizes trailing slashes before matching rules, so a forced slash-only redirect also matches its destination and loops. Existing files take precedence over fallback rules; missing Storybook assets return 404, never the main SPA. Query-based Storybook navigation stays in `/storybook/`.

If an older deployment returns `ERR_TOO_MANY_REDIRECTS`, `/storybook/index.html` bypasses the slash-only rule. Remove that rule and redeploy for the permanent fix. A cached 301 may require a hard refresh or a private window after deployment. This is a routing issue, not a requirement to delete demo workspace data. See [Netlify's trailing-slash documentation](https://docs.netlify.com/manage/routing/redirects/redirect-options/#trailing-slash).

Application routes fall back to the main `index.html`. Missing `/assets/*` and `/reports/*` return 404. Security headers restrict framing, content sniffing, camera/microphone/location, and executable sources. Storybook needs scoped inline scripts for its boot configuration. The main app does not enable inline script execution. Validate the actual provider's redirects and headers after deployment; the local server mimics asset routing, compression, and CSP but is not Netlify.

Preview the assembled directory with `pnpm preview` (127.0.0.1:4173). `pnpm dev` is the Vite development server. For deployment routing, use the assembled preview, not the Vite dev server.
