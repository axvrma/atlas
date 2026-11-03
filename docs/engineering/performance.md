# Measurement methodology

Run `pnpm benchmark` on an idle machine. The generated report records Node, OS, CPU, timestamp, methodology, 30 timed runs, median, and p95 after five warm-up iterations. Graph sizes are 10, 50, 100, and 250 nodes. Inputs are small and flat. Simulation measurements include validation, node traversal, trace generation, and final snapshot cloning.

These results measure CPU execution time. A Delay node contributes to simulated time, not wall-clock waiting. Do not compare virtual latency to CPU timings. Linear graphs with small payloads do not characterize all branching shapes or large nested payloads.

`pnpm build` measures elapsed benchmark + application build + assembly time and raw/gzip JavaScript sizes in `dist/reports/build.json`. Turborepo may use a warm local cache, so elapsed build times are contextual rather than a cold-build guarantee. The engine report is copied into the web output. The benchmark route fetches generated reports and does not invent missing values.

The app splits at route boundaries; graph code is separate. System typography avoids font requests. Hashed assets receive immutable caching. UI history and execution retention are bounded. Trace payload copying and full snapshots prioritize debugging simplicity over memory efficiency.

Lighthouse is measured separately with `pnpm lighthouse` while the assembled preview is running. The generated summary records tool version, browser, timestamp, mobile emulation, throttling, category scores, FCP, LCP, CLS, speed index, and total blocking time. Full raw JSON/HTML are retained in ignored `.tools/` output. This is one lab run, not field data. The local server serves gzip assets and enforces the deployment CSP. Field Core Web Vitals, large-canvas frame rates, memory profiles, and long-run interaction performance remain separate measurements. For Lighthouse, serve the assembled artifact (`pnpm preview`), run the tool against that URL, save its JSON/HTML report, and record tool version and hardware. No Lighthouse score is hardcoded into the product.
