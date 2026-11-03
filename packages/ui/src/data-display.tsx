import type { ReactNode } from 'react';
import type { ExecutionTrace } from '@atlas/contracts';
import { Badge } from './primitives';

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
}: {
  columns: { label: string; render: (row: T) => ReactNode }[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>
              {columns.map((c) => (
                <td key={c.label}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function MetricCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: ReactNode;
  note: string;
  icon?: ReactNode;
}) {
  return (
    <section className="card metric-card">
      <div className="metric-label">
        {label}
        {icon}
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </section>
  );
}
export function ChartContainer({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="chart-container" style={{ margin: 0 }} aria-label={label}>
      {children}
    </figure>
  );
}
export function StatusIndicator({ status }: { status: string }) {
  return (
    <Badge className={`status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {status[0]?.toUpperCase()}
      {status.slice(1)}
    </Badge>
  );
}
export const ExecutionStatus = StatusIndicator;
export function Timeline({ items }: { items: { title: string; detail: ReactNode }[] }) {
  return (
    <ol className="timeline">
      {items.map((i, index) => (
        <li className="timeline-item" key={index}>
          <h4 style={{ fontSize: 12, marginBottom: 4 }}>{i.title}</h4>
          {i.detail}
        </li>
      ))}
    </ol>
  );
}
export function ExecutionLog({ logs }: { logs: string[] }) {
  return (
    <div className="execution-log" role="log">
      {logs.map((l, i) => (
        <div key={i}>
          <span style={{ color: 'var(--muted)' }}>{String(i + 1).padStart(2, '0')} </span>
          {l}
        </div>
      ))}
    </div>
  );
}
export function TraceSummary({ trace }: { trace: ExecutionTrace }) {
  return (
    <div>
      <StatusIndicator status={trace.status} />
      <h3 style={{ margin: '12px 0' }}>{trace.nodeName}</h3>
      <p>
        {trace.durationMs} ms simulated · {trace.attempts} attempt{trace.attempts === 1 ? '' : 's'}
      </p>
    </div>
  );
}
