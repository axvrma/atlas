# ADR 004: One static Netlify deployment

Status: accepted.

Vite and Storybook produce independent static artifacts. The root script measures and assembles them into one `dist` directory. This supports the required same-origin URL architecture with no runtime server or environment variables.

Netlify asset-first serving handles existing Storybook resources. Scoped missing-asset rules prevent the app fallback from returning HTML for missing Storybook scripts. Main product routes use an SPA fallback. A local static server mimics these routing decisions for browser tests, but provider headers and DNS must be checked after an authorized real deployment.

A separate Storybook domain was rejected because it violates product routing requirements. SSR and edge functions were not chosen: there is no server-owned data or authenticated workload. The SEO limitation of client-rendered route content is documented; the landing HTML contains canonical, description, and Open Graph metadata. Domain configuration remains an external manual step.
