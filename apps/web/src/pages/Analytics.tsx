import { useState } from 'react';
import { Activity, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Badge, Card, EmptyState, MetricCard, Select, StatusIndicator } from '@atlas/ui';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { summarize } from '../features/analytics';
import { VolumeChart } from '../components/VolumeChart';
export default function Analytics() {
  const { data } = useWorkspace();
  const [workflow, setWorkflow] = useState('all');
  const [source, setSource] = useState('all');
  const [range, setRange] = useState('all');
  const anchor = Math.max(...data.executions.map((e) => Date.parse(e.startedAt)), 0);
  const executions = data.executions.filter(
    (e) =>
      (workflow === 'all' || e.workflowId === workflow) &&
      (source === 'all' || e.source === source) &&
      (range === 'all' || Date.parse(e.startedAt) >= anchor - Number(range) * 86400000),
  );
  const stats = summarize(executions);
  const usage = data.workflows
    .map((w) => ({ w, total: executions.filter((e) => e.workflowId === w.id).length }))
    .sort((a, b) => b.total - a.total);
  const failures = new Map<string, number>();
  executions.forEach((e) =>
    e.traces
      .filter((t) => t.status === 'failed')
      .forEach((t) => failures.set(t.nodeName, (failures.get(t.nodeName) ?? 0) + 1)),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE SENSE OF THE SIGNAL</div>
          <h1>
            Workflow analytics<span className="heading-dot">.</span>
          </h1>
          <p>A clearer picture of what runs, what works, and what needs attention.</p>
        </div>
        <Badge tone="purple">Derived from recorded executions</Badge>
      </div>
      <div className="analytics-filters">
        <Select
          aria-label="Analytics workflow"
          value={workflow}
          onChange={(e) => setWorkflow(e.target.value)}
        >
          <option value="all">All workflows</option>
          {data.workflows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Analytics source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="all">All records</option>
          <option value="local">Your local runs</option>
          <option value="seeded">Seeded samples</option>
        </Select>
        <Select
          aria-label="Analytics date range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="all">All recorded dates</option>
          <option value="7">Last 7 recorded days</option>
          <option value="1">Last recorded day</option>
        </Select>
      </div>
      {!executions.length ? (
        <EmptyState
          title="Your next run is the first data point"
          description="No executions match these filters. Run a workflow or include the seeded samples."
        />
      ) : (
        <>
          <div className="metrics-grid">
            <MetricCard
              label="Total executions"
              value={stats.total}
              note={`${executions.filter((e) => e.source === 'seeded').length} seeded · ${executions.filter((e) => e.source === 'local').length} local`}
              icon={<Activity size={15} />}
            />
            <MetricCard
              label="Success rate"
              value={`${stats.rate}%`}
              note={`${stats.completed} completed runs`}
              icon={<CheckCircle2 size={15} />}
            />
            <MetricCard
              label="Failure rate"
              value={`${Math.round((stats.failed / stats.total) * 100)}%`}
              note={`${stats.failed} failed runs`}
              icon={<XCircle size={15} />}
            />
            <MetricCard
              label="Average simulated latency"
              value={
                <>
                  {stats.latency}
                  <small> ms</small>
                </>
              }
              note="Virtual time, not wall-clock speed"
              icon={<Clock3 size={15} />}
            />
          </div>
          <Card>
            <div className="section-heading">
              <div>
                <h3>Execution volume</h3>
                <p>Seven days ending with the latest matching execution.</p>
              </div>
              <div className="chart-legend">
                <span>
                  <i style={{ background: 'var(--brand)' }} />
                  Completed
                </span>
                <span>
                  <i style={{ background: 'var(--red)' }} />
                  Failed
                </span>
              </div>
            </div>
            <VolumeChart executions={executions} />
          </Card>
          <div className="analytics-bottom">
            <Card>
              <h3>Workflow usage</h3>
              <p className="card-description">Most frequently simulated workflows.</p>
              <div className="usage-list">
                {usage
                  .filter((u) => u.total > 0)
                  .map(({ w, total }) => (
                    <div key={w.id}>
                      <div className="row spread">
                        <span>{w.name}</span>
                        <span className="mono muted">{total} runs</span>
                      </div>
                      <div className="usage-track">
                        <span style={{ width: `${(total / stats.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
            <Card>
              <h3>Where failures happen</h3>
              <p className="card-description">Failed node executions, grouped by name.</p>
              {failures.size ? (
                <div className="failure-list">
                  {[...failures].map(([name, count]) => (
                    <div key={name} className="row spread">
                      <span>{name}</span>
                      <Badge tone="red">
                        {count} failure{count === 1 ? '' : 's'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="A clean run" description="No failed nodes in these records." />
              )}
              <hr />
              <div className="row spread">
                <StatusIndicator status="completed" />
                <span className="muted">
                  {stats.completed} / {stats.total} runs completed
                </span>
              </div>
            </Card>
          </div>
        </>
      )}
      <p className="page-footnote">
        All metrics are calculated from browser-local execution records. Date ranges are relative to
        the latest matching record. No production telemetry is collected.
      </p>
    </>
  );
}
