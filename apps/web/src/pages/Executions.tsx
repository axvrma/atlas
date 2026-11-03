import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Search } from 'lucide-react';
import {
  Badge,
  DataTable,
  EmptyState,
  Input,
  Pagination,
  Select,
  StatusIndicator,
  Surface,
} from '@atlas/ui';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { dateLabel } from '../features/analytics';
export default function Executions() {
  const { data } = useWorkspace();
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const executions = data.executions
    .filter(
      (e) =>
        (status === 'all' || e.status === status) &&
        `${e.workflowName} ${e.id}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'duration'
        ? b.durationMs - a.durationMs
        : sort === 'oldest'
          ? a.startedAt.localeCompare(b.startedAt)
          : b.startedAt.localeCompare(a.startedAt),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FOLLOW EVERY STEP</div>
          <h1>
            Executions<span className="heading-dot">.</span>
          </h1>
          <p>The evidence behind every outcome. Inspect, replay, and understand.</p>
        </div>
        <Badge tone="purple">
          <Activity size={12} />
          {data.executions.length} recorded runs
        </Badge>
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={15} />
          <Input
            aria-label="Search executions"
            placeholder="Search by workflow or run ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          aria-label="Execution status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All outcomes</option>
          {['completed', 'failed', 'cancelled'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select aria-label="Sort executions" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="duration">Longest duration</option>
        </Select>
      </div>
      <Surface>
        {executions.length ? (
          <>
            <DataTable
              caption="Execution history"
              rows={executions.slice((page - 1) * 10, page * 10)}
              rowKey={(e) => e.id}
              columns={[
                {
                  label: 'WORKFLOW / RUN',
                  render: (e) => (
                    <Link className="execution-title" to={`/app/executions/${e.id}`}>
                      <strong>{e.workflowName}</strong>
                      <code>{e.id.slice(0, 16)}</code>
                    </Link>
                  ),
                },
                { label: 'OUTCOME', render: (e) => <StatusIndicator status={e.status} /> },
                {
                  label: 'SIMULATED DURATION',
                  render: (e) => <span className="mono">{e.durationMs} ms</span>,
                },
                {
                  label: 'STEPS',
                  render: (e) =>
                    `${e.traces.filter((t) => t.status !== 'skipped').length} / ${e.snapshot.nodes.length}`,
                },
                {
                  label: 'STARTED',
                  render: (e) => <span className="muted">{dateLabel(e.startedAt)}</span>,
                },
                {
                  label: 'SOURCE',
                  render: (e) => (
                    <Badge>{e.source === 'seeded' ? 'Seeded sample' : 'Local run'}</Badge>
                  ),
                },
                {
                  label: 'DETAILS',
                  render: (e) => (
                    <Link
                      aria-label={`Inspect ${e.id}`}
                      className="icon-button"
                      to={`/app/executions/${e.id}`}
                    >
                      <ArrowRight size={15} />
                    </Link>
                  ),
                },
              ]}
            />
            <Pagination page={page} total={executions.length} onChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No runs on this path yet"
            description="Adjust your filters or run a workflow to begin building an execution history."
            action={
              <Link className="button" to="/app/workflows">
                Open workflows
              </Link>
            }
          />
        )}
      </Surface>
      <p className="page-footnote">
        Durations represent the simulated clock. Seeded records are produced by the same engine as
        local runs.
      </p>
    </>
  );
}
