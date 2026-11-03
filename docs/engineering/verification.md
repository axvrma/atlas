# Verification record

Verified locally on 3 November 2026 using Node 22.22.0, pnpm 10.10.0, macOS arm64, and an Apple M1 Pro. Results describe this checkout and local static preview, not an external deployment. Machine-readable timestamps and scope accompany reports in `apps/web/public/reports/` and `dist/reports/`.

## Executed checks

| Check                            | Result                        | Evidence / scope                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh installation               | Passed                        | Copied source into an empty ignored checkout; `pnpm install --offline --frozen-lockfile` completed, followed by a passing type check. No existing node_modules was copied.                                                                      |
| TypeScript                       | Passed                        | `pnpm typecheck`; strict mode and unchecked indexed access enabled.                                                                                                                                                                             |
| ESLint                           | Passed                        | `pnpm lint`; compatible ESLint 10 and TypeScript ESLint tooling.                                                                                                                                                                                |
| Formatting                       | Passed                        | `pnpm format:check` after final source/report formatting.                                                                                                                                                                                       |
| Unit / component / storage tests | 34 passed                     | Three Vitest files: engine, accessible components, and versioned browser storage.                                                                                                                                                               |
| Coverage                         | 73.10% lines overall          | Engine, shared UI, and storage adapter only. 73.89% statements, 73.98% branches, 53.37% functions. Engine line coverage: 93.64%. This is not whole-application coverage.                                                                        |
| Chromium E2E                     | 23 passed                     | No failed, flaky, or skipped cases. CRUD, node movement/connections, undo/redo/reset, validation, input JSON, simulation, debugger, analytics, Copilot, themes, onboarding, persistence, responsive navigation, and all direct route refreshes. |
| Automated accessibility          | Passed in tested states       | Axe WCAG 2 A/AA and 2.1 A/AA tags across landing, overview, library, and accessible editor, in light and dark modes: eight screen/theme audits.                                                                                                 |
| Production build                 | Passed                        | Root `pnpm build` builds web and Storybook and assembles one `dist` directory.                                                                                                                                                                  |
| Storybook static build           | Passed                        | Separate application consumes workspace UI source; manager and interactive iframe loaded at `/storybook/` with scoped CSP.                                                                                                                      |
| Asset routing                    | Passed locally                | Missing main/Storybook assets return 404; every product route supports direct navigation and refresh.                                                                                                                                           |
| Browser error checks             | Passed                        | E2E captures uncaught page errors and React/other console errors. No critical product console errors in tested journeys.                                                                                                                        |
| Dependency audit                 | Zero reported vulnerabilities | Full `pnpm audit`, including development tools, after patched minimatch/glob overrides and compatible ESLint update. Advisory databases can change.                                                                                             |
| Engine benchmarks                | Generated                     | 10, 50, 100, and 250 nodes; five warm-ups and 30 measured samples at each size, with median/p95 and environment recorded.                                                                                                                       |
| Visual review                    | Executed                      | Actual desktop, mobile, editor, debugger, light, and dark captures in `docs/screenshots`. Node zoom, palette labels, contrast, workflow-name width, and minimap masking were reviewed and corrected.                                            |

The coverage report is `coverage/index.html`. Playwright reports, traces, and screenshot attachments are in `playwright-report/` and `test-results/`. These generated directories are ignored. `pnpm report` creates a portable measured summary after both test suites.

## Lighthouse laboratory measurement

`pnpm lighthouse` audited the gzip-enabled assembled landing page using Lighthouse 13.6.0 and installed Playwright Chromium, with mobile emulation, simulated network throttling, and a 4× CPU slowdown. The recorded run measured:

| Category       | Score |
| -------------- | ----- |
| Performance    | 95    |
| Accessibility  | 100   |
| Best Practices | 96    |
| SEO            | 100   |

Recorded lab metrics include FCP 1.1 s, LCP 2.9 s, CLS 0, and displayed total blocking time 10 ms. These are one local run, not field Core Web Vitals or a guarantee. The JSON summary records exact values, tool/browser versions, settings, URL, and timestamp. Full raw JSON/HTML are retained in `.tools/lighthouse.json` and `.tools/lighthouse.html` and can be reproduced with the committed script. A score of 100 in an automated accessibility audit does not establish complete WCAG conformance.

## Boundaries and remaining manual work

- No code was pushed, remote repository created, site deployed, or DNS configured. Public hosting at `atlas.axvrma.com` remains unfulfilled because external account changes were explicitly outside authorization. Follow `docs/deployment/netlify.md` to connect the repository, deploy the artifact, add the domain, and verify real provider routing, headers, and TLS.
- GitHub Actions is configured in source. Its hosted execution is unverified until an authorized push triggers it.
- Manual screen-reader/device review and a complete WCAG audit remain outstanding. Chromium and representative axe states are the automated browser scope; Firefox, WebKit, and all assistive technologies are not claimed as verified.
- Engine stress tests do not measure canvas frame rate or memory limits. No field INP or real-user telemetry is collected.
- Standalone component unit coverage is selective. Major product compositions are additionally exercised by E2E, screenshot capture, and axe; every export does not have exhaustive isolated state tests.
- Screenshot artifacts are stable seeded-state captures, not cross-platform pixel-diff baselines.
- Execution is a local single-path DAG simulation, with no cycles, parallel orchestration, arbitrary code, real HTTP effects, notifications, cloud collaboration, or LLM provider.
