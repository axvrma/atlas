import { useEffect, useState } from 'react';
import { ArrowRight, Check, FlaskConical, Terminal } from 'lucide-react';
import { Badge, Card, DataTable } from '@atlas/ui';
import { PublicFooter, PublicHeader } from './Landing';
type LighthouseReport = {
  generatedAt: string;
  lighthouseVersion: string;
  url: string;
  settings: { formFactor: string; throttlingMethod: string };
  categories: Record<string, { title: string; score: number | null }>;
  metrics: Record<string, { value?: number; displayValue?: string }>;
};
type EngineReport = {
  generatedAt: string;
  environment: string;
  samples: number;
  results: {
    nodes: number;
    validationMedianMs: number;
    validationP95Ms: number;
    simulationMedianMs: number;
    simulationP95Ms: number;
  }[];
};
type QualityReport = {
  unit?: { passed: number; failed: number; total: number };
  generatedAt: string;
  coverage: {
    lines: { pct: number };
    statements: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  browser: { passed: number; failed: number; skipped: number; flaky: number; durationMs: number };
  scope: string;
};
type BuildReport = {
  generatedAt: string;
  durationSeconds: number;
  assets: { name: string; bytes: number; gzipBytes: number }[];
};
export default function Benchmarks() {
  const [webQuality, setWebQuality] = useState<LighthouseReport>();
  const [quality, setQuality] = useState<QualityReport>();
  const [engine, setEngine] = useState<EngineReport>();
  const [build, setBuild] = useState<BuildReport>();
  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        fetch('/reports/lighthouse.json').then(async (r) => {
          if (r.ok && r.headers.get('content-type')?.includes('json'))
            setWebQuality((await r.json()) as LighthouseReport);
        }),
        fetch('/reports/engine.json').then(async (r) => {
          if (r.ok && r.headers.get('content-type')?.includes('json'))
            setEngine((await r.json()) as EngineReport);
        }),
        fetch('/reports/quality.json').then(async (r) => {
          if (r.ok && r.headers.get('content-type')?.includes('json'))
            setQuality((await r.json()) as QualityReport);
        }),
        fetch('/reports/build.json').then(async (r) => {
          if (r.ok && r.headers.get('content-type')?.includes('json'))
            setBuild((await r.json()) as BuildReport);
        }),
      ]);
      void results;
    };
    void load();
  }, []);
  return (
    <>
      <PublicHeader />
      <main id="main" tabIndex={-1} className="benchmarks-page">
        <div className="eyebrow">EVIDENCE, NOT ESTIMATES</div>
        <h1>Show the working.</h1>
        <p className="docs-intro">
          Real measurements, reproducible scripts, and a clear line between what’s verified and what
          isn’t.
        </p>
        <div className="measurement-notice">
          <FlaskConical size={20} />
          <p>
            Results describe this build environment. They are not production SLAs. Engine CPU time
            and simulated workflow latency are different measurements.
          </p>
        </div>
        <section>
          <div className="section-heading">
            <div>
              <h2>Workflow engine</h2>
              <p>Valid linear graphs · warm-up + repeated measurements · median and p95</p>
            </div>
            <Badge tone={engine ? 'green' : 'amber'}>
              {engine ? 'Measured' : 'Not generated yet'}
            </Badge>
          </div>
          {engine ? (
            <>
              <p className="benchmark-env">
                {engine.environment} · {engine.samples} samples per graph · Generated{' '}
                {new Date(engine.generatedAt).toLocaleString()}
              </p>
              <div className="surface">
                <DataTable
                  caption="Measured engine performance"
                  rows={engine.results}
                  rowKey={(r) => String(r.nodes)}
                  columns={[
                    { label: 'GRAPH SIZE', render: (r) => `${r.nodes} nodes` },
                    {
                      label: 'VALIDATION MEDIAN',
                      render: (r) => `${r.validationMedianMs.toFixed(3)} ms`,
                    },
                    {
                      label: 'VALIDATION P95',
                      render: (r) => `${r.validationP95Ms.toFixed(3)} ms`,
                    },
                    {
                      label: 'SIMULATION MEDIAN',
                      render: (r) => `${r.simulationMedianMs.toFixed(3)} ms`,
                    },
                    {
                      label: 'SIMULATION P95',
                      render: (r) => `${r.simulationP95Ms.toFixed(3)} ms`,
                    },
                  ]}
                />
              </div>
            </>
          ) : (
            <Card>
              <p>
                Run <code>pnpm benchmark</code> to generate the engine report. No timing is shown
                until measured.
              </p>
            </Card>
          )}
          <div className="command-line">
            <Terminal size={14} />
            <code>pnpm benchmark</code>
            <ArrowRight size={13} />
            <span>apps/web/public/reports/engine.json</span>
          </div>
        </section>
        <section>
          <div className="section-heading">
            <div>
              <h2>Production build</h2>
              <p>Emitted JavaScript chunks, including lazy graph dependencies.</p>
            </div>
            <Badge tone={build ? 'green' : 'amber'}>
              {build ? 'Measured' : 'Not generated yet'}
            </Badge>
          </div>
          {build ? (
            <>
              <p className="benchmark-env">
                Web + Storybook build: {build.durationSeconds.toFixed(2)} s · Generated{' '}
                {new Date(build.generatedAt).toLocaleString()}
              </p>
              <div className="surface">
                <DataTable
                  caption="Build bundle sizes"
                  rows={build.assets}
                  rowKey={(r) => r.name}
                  columns={[
                    { label: 'JAVASCRIPT CHUNK', render: (r) => <code>{r.name}</code> },
                    { label: 'RAW SIZE', render: (r) => `${(r.bytes / 1024).toFixed(1)} KiB` },
                    { label: 'GZIP SIZE', render: (r) => `${(r.gzipBytes / 1024).toFixed(1)} KiB` },
                  ]}
                />
              </div>
            </>
          ) : (
            <Card>
              <p>
                Run <code>pnpm build</code>. The build script measures elapsed time and writes
                emitted asset sizes to <code>dist/reports/build.json</code>.
              </p>
            </Card>
          )}
        </section>
        <section>
          <div className="section-heading">
            <div>
              <h2>Web performance</h2>
              <p>Lighthouse lab audit of the assembled landing page.</p>
            </div>
            <Badge tone={webQuality ? 'green' : 'amber'}>
              {webQuality ? 'Measured' : 'Not measured yet'}
            </Badge>
          </div>
          {webQuality ? (
            <>
              <p className="benchmark-env">
                Lighthouse {webQuality.lighthouseVersion} · {webQuality.settings.formFactor} ·{' '}
                {webQuality.settings.throttlingMethod} throttling ·{' '}
                {new Date(webQuality.generatedAt).toLocaleString()}
              </p>
              <div className="lighthouse-grid">
                {Object.entries(webQuality.categories).map(([key, category]) => (
                  <Card key={key}>
                    <span className="metric-label">{category.title}</span>
                    <div className="metric-value">
                      {category.score ?? 'Unavailable'}
                      <small>{category.score !== null ? ' / 100' : ''}</small>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="lab-metrics">
                {Object.entries(webQuality.metrics).map(([key, metric]) => (
                  <span key={key}>
                    {key.replaceAll('-', ' ')}{' '}
                    <strong>{metric.displayValue ?? 'Unavailable'}</strong>
                  </span>
                ))}
              </div>
              <p className="page-footnote">
                One local lab run, not field Core Web Vitals. No INP or real-user telemetry is
                collected. The source report records browser and throttling details.
              </p>
            </>
          ) : (
            <Card>
              <p>
                Start the assembled preview, then run <code>pnpm lighthouse</code>. Scores remain
                unavailable until the audit finishes.
              </p>
            </Card>
          )}
        </section>
        <section>
          <h2>Web quality & test evidence</h2>
          {quality && (
            <>
              <p className="benchmark-env">
                Latest generated verification · {new Date(quality.generatedAt).toLocaleString()}
              </p>
              <div className="verification-metrics">
                <Card>
                  <h3>{quality.browser.passed} browser tests passed</h3>
                  <p>
                    {quality.unit && <>{quality.unit.passed} unit / component tests passed. </>}
                    {quality.browser.failed} browser failures · {quality.browser.flaky} flaky ·{' '}
                    {quality.browser.skipped} skipped
                  </p>
                </Card>
                <Card>
                  <h3>{quality.coverage.lines.pct}% line coverage</h3>
                  <p>
                    {quality.coverage.statements.pct}% statements · {quality.coverage.branches.pct}%
                    branches · {quality.coverage.functions.pct}% functions
                  </p>
                </Card>
              </div>
              <p className="benchmark-env">{quality.scope}</p>
            </>
          )}
          <p className="card-description">
            These metrics require separate tools or field data. Availability is explicit.
          </p>
          <div className="quality-grid">
            {[
              {
                label: 'Field Core Web Vitals',
                text: 'No real-user telemetry is collected. The lab audit above is a single controlled run; it does not establish field performance.',
              },
              {
                label: 'Test results & coverage',
                text: 'Use pnpm test:coverage and pnpm test:e2e for current results. Coverage HTML and Playwright reports are local and CI artifacts. Run pnpm report after both suites to publish their measured summary here.',
              },
              {
                label: 'Canvas rendering limits',
                text: 'Engine stress tests cover up to 250 nodes. They do not prove canvas frame rate. Profile rendering on target hardware before making smoothness claims.',
              },
            ].map((i) => (
              <Card key={i.label}>
                <Badge tone="amber">Separate verification</Badge>
                <h3>{i.label}</h3>
                <p>{i.text}</p>
              </Card>
            ))}
          </div>
        </section>
        <div className="benchmark-reproduce">
          <Check size={18} />
          <div>
            <h3>Built to be questioned. Easy to reproduce.</h3>
            <p>
              Source scripts, environment details, and generated artifacts make these measurements
              inspectable.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
