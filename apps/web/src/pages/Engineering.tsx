import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Braces,
  CheckCircle2,
  Database,
  GitBranch,
  Layers3,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { Badge } from '@atlas/ui';
import { PublicFooter, PublicHeader } from './Landing';
const sections = [
  { to: '/engineering', label: 'Overview' },
  { to: '/engineering/architecture', label: 'Architecture' },
  { to: '/engineering/design-system', label: 'Design system' },
  { to: '/engineering/performance', label: 'Performance' },
  { to: '/engineering/testing', label: 'Testing & accessibility' },
];
const content: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: { title: string; text: string; code?: string }[];
  }
> = {
  '/engineering/architecture': {
    eyebrow: 'THE BOUNDARIES MATTER',
    title: 'One product. Clear ownership.',
    intro:
      'A TypeScript monorepo keeps domain behavior independent of the interface while sharing contracts, components, and tokens between applications.',
    sections: [
      {
        title: 'The package graph',
        text: 'The web app depends on UI, core, contracts, and mock data. Storybook consumes the same UI and tokens. Core depends only on contracts; it imports no React or browser APIs.',
        code: 'apps/web ───────────┬── packages/ui ─── tokens\n                    ├── packages/core ─── contracts\n                    └── packages/mock-data ─── core\napps/storybook ───────── packages/ui',
      },
      {
        title: 'From event to evidence',
        text: 'The engine validates the graph, locates its single trigger, and walks one active path. A condition chooses its true or false edge. Nodes copy and transform payloads; each visit produces an immutable trace snapshot. Unvisited nodes are explicitly marked skipped. DAG joins are allowed, but parallel fan-out and cycles are rejected.',
      },
      {
        title: 'A deliberate execution lifecycle',
        text: 'A simulation starts pending, moves to running on its first step, and finishes completed, failed, or cancelled. The step API supports cooperative cancellation between nodes. Virtual durations affect timestamps without real waiting. HTTP fixtures support bounded retries. No arbitrary JavaScript or URLs execute.',
      },
      {
        title: 'Local persistence with recovery',
        text: 'A versioned IndexedDB record stores workflows, execution snapshots, and preferences. Writes are serialized and debounced. Version 1 imports migrate to version 2 and pass runtime validation. If IndexedDB fails, localStorage is attempted; otherwise the UI stays usable in memory and asks visitors to export their work.',
      },
      {
        title: 'Static by design',
        text: 'Vite builds the app and Storybook builds separately. A root script combines both artifacts into one dist directory, with Storybook under /storybook/. Netlify uses asset-first routing and scoped SPA fallbacks. No credentials, authentication, or runtime services are needed.',
      },
      {
        title: 'Recovery is part of the architecture',
        text: 'Invalid graph and input boundaries produce actionable errors. Missing records and routes have recovery links. A React error boundary catches unexpected rendering errors. Imports are size-limited and runtime validated. Execution history retains at most 500 records to bound browser storage.',
      },
    ],
  },
  '/engineering/design-system': {
    eyebrow: 'A COHERENT VISUAL LANGUAGE',
    title: 'Shared foundations. Considered details.',
    intro:
      'The product and component library use the same source. Tokens encode visual intent; components own semantics and behavior.',
    sections: [
      {
        title: 'Tokens before decoration',
        text: 'Semantic CSS custom properties define surfaces, text, borders, brand, and status colors. Light and dark modes share names, so components adapt without duplicating styles. A restrained spacing scale, three radius levels, and a shared font stack keep the UI consistent.',
      },
      {
        title: 'Composition over configuration',
        text: 'Typed buttons, fields, badges, tables, dialogs, navigation, and workflow visuals are exported by packages/ui. FormField composes a label, input, hint, and validation message. Workflow visuals accept domain models and render consistently in the editor, debugger, preview, and Storybook.',
      },
      {
        title: 'Accessible behavior at the boundary',
        text: 'Radix primitives handle dialog focus trapping, Escape dismissal, dropdown keyboard navigation, and tooltip behavior. Native inputs, selects, range controls, checkboxes, and radio groups retain platform semantics. Visible focus rings and text status labels avoid color-only communication.',
      },
      {
        title: 'Theming that follows the visitor',
        text: 'The persisted preference can be light, dark, or system. A media-query listener tracks live OS theme changes. Storybook offers a theme toolbar using the same tokens. Reduced-motion preferences disable nonessential transitions.',
      },
      {
        title: 'An independent component workshop',
        text: 'The Storybook app consumes workspace UI exports. Stories cover foundations, actions, forms, navigation, feedback, data display, workflow components, and product patterns. Controls, themes, responsive viewports, and the accessibility addon support focused review.',
      },
    ],
  },
  '/engineering/performance': {
    eyebrow: 'MEASURE, THEN DECIDE',
    title: 'Performance with evidence.',
    intro:
      'The benchmark page separates measured results from unavailable metrics. Virtual execution latency is never presented as actual engine speed.',
    sections: [
      {
        title: 'Load the tool when it is needed',
        text: 'Routes use React.lazy and Suspense. XYFlow and Dagre are isolated into a graph chunk, loaded with the editor or debugger. The landing preview uses lightweight shared node components and an SVG path rather than loading the full graph editor.',
      },
      {
        title: 'Stable graph updates',
        text: 'Canvas node rendering is memoized. Editor graph data, edges, and diagnostics use memoization with explicit dependencies. Dragging commits a single undo entry on release; intermediate positions update without copying the history stack. Undo history is bounded to 50 snapshots.',
      },
      {
        title: 'A reproducible engine benchmark',
        text: 'The benchmark script generates valid linear graphs at 10, 50, 100, and 250 nodes, warms the engine, and records repeated validation and simulation timings using performance.now(). The report stores environment, sample count, median, and p95. These CPU timings are distinct from simulated timestamps.',
      },
      {
        title: 'Bundle and asset accounting',
        text: 'The production build script records elapsed build time and raw and gzip sizes of emitted JavaScript chunks. Source maps support production profiling. Fonts use the platform stack, avoiding external font fetches and font-swap shifts. Static hashed assets receive immutable cache headers.',
      },
      {
        title: 'Honest limits',
        text: 'No field Core Web Vitals are collected. Lighthouse results and coverage remain unavailable until their respective tools run. Engine stress measurements do not demonstrate canvas smoothness; large-canvas rendering needs a separate browser profile. Snapshot history and trace payload copying trade memory for inspectability.',
      },
    ],
  },
  '/engineering/testing': {
    eyebrow: 'CONFIDENCE IS EARNED',
    title: 'Test the behavior that matters.',
    intro:
      'Verification follows the highest-risk boundaries: graph logic, data integrity, keyboard interactions, browser persistence, and deployment routing.',
    sections: [
      {
        title: 'Domain tests',
        text: 'Vitest exercises graph validation, conditions, transforms, all node kinds, errors, bounded retries, deterministic output, state transitions, cancellation, serialization, and prototype-path rejection. Seed workflows execute through the actual engine rather than hand-authored trace fixtures.',
      },
      {
        title: 'Component and persistence tests',
        text: 'Testing Library covers button states, form validation, dialog keyboard dismissal, navigation tabs, workflow visuals, and inspector updates. IndexedDB tests use fake-indexeddb to check persistence, import validation, and deliberate migration. Theme and storage behavior are also checked in the browser.',
      },
      {
        title: 'Browser journeys',
        text: 'Playwright drives the assembled production directory. Journeys cover onboarding, CRUD, graph connections, validation, execution debugging, analytics updates, persistence after refresh, reset, themes, direct routes, responsive layouts, and Storybook at its production prefix. Browser errors are captured as failures.',
      },
      {
        title: 'Accessibility is a parallel path',
        text: 'Axe checks representative light and dark screens. The editor offers a native-control node and connection list alongside the canvas. Dialogs trap focus, navigation has a skip link, and status text accompanies color. Automated checks do not replace screen-reader and assistive-device testing; those manual reviews are documented as outstanding.',
      },
      {
        title: 'CI quality gates',
        text: 'GitHub Actions installs with a frozen lockfile, type-checks, lints, checks formatting, runs coverage tests, builds both applications, and runs Chromium E2E and axe checks against the combined artifact. Reports and failure screenshots are uploaded. No cloud credentials or paid services are needed.',
      },
    ],
  },
};
export default function Engineering() {
  const { pathname } = useLocation();
  const page = content[pathname];
  return (
    <>
      <PublicHeader />
      <main id="main" tabIndex={-1} className="engineering-page">
        <aside className="docs-sidebar">
          <span className="eyebrow">INSIDE ATLAS</span>
          <nav aria-label="Engineering documentation">
            {sections.map((s) => (
              <NavLink
                key={s.to}
                end
                to={s.to}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {s.label}
              </NavLink>
            ))}
          </nav>
          <a href="/storybook/" className="text-link">
            Component library
            <ArrowUpRight size={12} />
          </a>
          <Link to="/benchmarks" className="text-link">
            Measured benchmarks
            <ArrowRight size={12} />
          </Link>
        </aside>
        <article className="docs-article">
          {page ? (
            <>
              <Badge tone="purple">ENGINEERING NOTES</Badge>
              <div className="eyebrow" style={{ marginTop: 24 }}>
                {page.eyebrow}
              </div>
              <h1>{page.title}</h1>
              <p className="docs-intro">{page.intro}</p>
              {page.sections.map((s) => (
                <section key={s.title}>
                  <h2>{s.title}</h2>
                  <p>{s.text}</p>
                  {s.code && <pre className="architecture-code">{s.code}</pre>}
                </section>
              ))}
              <div className="docs-source">
                <Braces size={17} />
                <span>
                  Explore the implementation in <code>packages/</code>, <code>apps/</code>, and{' '}
                  <code>docs/</code>.
                </span>
              </div>
            </>
          ) : (
            <>
              <Badge tone="purple">
                <Braces size={12} />
                OPEN ENGINEERING
              </Badge>
              <h1>
                Craft above the surface.
                <br />
                Clarity below it.
              </h1>
              <p className="docs-intro">
                Atlas Studio is an independent engineering showcase. A real workflow engine, a
                shared design system, and a local-first product—with decisions you can inspect.
              </p>
              <div className="engineering-grid">
                {[
                  {
                    icon: GitBranch,
                    title: 'Framework-independent engine',
                    text: 'A typed, deterministic graph runtime with safe operators and inspectable traces.',
                    to: '/engineering/architecture',
                  },
                  {
                    icon: Layers3,
                    title: 'One design system',
                    text: 'Tokens and accessible components shared by the product and Storybook.',
                    to: '/engineering/design-system',
                  },
                  {
                    icon: Timer,
                    title: 'Measured performance',
                    text: 'Reproducible engine timings and bundle reports. No invented quality scores.',
                    to: '/engineering/performance',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Behavior under test',
                    text: 'Domain, component, browser, and automated accessibility checks.',
                    to: '/engineering/testing',
                  },
                ].map(({ icon: Icon, title, text, to }) => (
                  <Link className="card" key={to} to={to}>
                    <Icon size={23} />
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <span className="text-link">
                      Read the decisions
                      <ArrowRight size={13} />
                    </span>
                  </Link>
                ))}
              </div>
              <section>
                <h2>Small pieces, meaningful boundaries.</h2>
                <p>
                  React and Vite power the product. XYFlow handles graph interaction. Zod validates
                  data at runtime, IndexedDB owns local persistence, and Radix provides accessible
                  overlay behavior. pnpm workspaces and Turborepo coordinate the monorepo.
                </p>
                <div className="architecture-strip">
                  <span>
                    <Boxes size={18} />
                    Web + Storybook
                  </span>
                  <ArrowRight size={16} />
                  <span>
                    <Braces size={18} />
                    UI + Core
                  </span>
                  <ArrowRight size={16} />
                  <span>
                    <Database size={18} />
                    Contracts + Storage
                  </span>
                </div>
              </section>
              <section>
                <h2>Trade-offs, made explicit.</h2>
                <p>
                  Single-path DAG execution keeps branching predictable; parallel orchestration is
                  outside this implementation. Simulated AI uses transparent keyword rules and
                  templates. Local storage isolates visitors, while exports provide portability. A
                  static deployment removes operational services but cannot offer team
                  collaboration.
                </p>
              </section>
              <section>
                <h2>Evidence over adjectives.</h2>
                <p>
                  Repository tests, generated reports, and a reproducible build support the
                  engineering story. Browser accessibility checks have a limited scope. Manual
                  assistive-technology testing, field performance, and external hosting
                  configuration require additional verification.
                </p>
                <Link className="button" to="/benchmarks">
                  <CheckCircle2 size={14} />
                  Review the measurements
                  <ArrowRight size={13} />
                </Link>
              </section>
            </>
          )}
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
