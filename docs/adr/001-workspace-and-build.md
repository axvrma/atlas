# ADR 001: A monorepo with independently built applications

Status: accepted.

The product and Storybook share source, contracts, tokens, and tooling but have different runtime entry points. pnpm workspaces make dependency boundaries explicit; Turborepo coordinates builds and local caching. React and Vite provide a mature component ecosystem and static output with lazy route chunks. Source-only internal packages are compiled by the consuming applications, avoiding a second package compilation pipeline.

A single package would be simpler initially but blur the UI/engine boundary. Publishing independent libraries would add release overhead without a consumer. Micro-frontends were considered unnecessary: this product has one ownership boundary and one deployment, so runtime composition would increase complexity without providing team autonomy.

Storybook remains a separate app to prevent documentation tooling from entering the product bundle. The root build combines outputs for one origin and one Netlify publish directory. Storybook stays at `/storybook/`; asset routing is tested independently of the main SPA.
