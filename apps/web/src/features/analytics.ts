import type { Execution } from '@atlas/contracts';
export function summarize(executions: Execution[]) {
  const completed = executions.filter((e) => e.status === 'completed').length;
  const failed = executions.filter((e) => e.status === 'failed').length;
  return {
    total: executions.length,
    completed,
    failed,
    rate: executions.length ? Math.round((completed / executions.length) * 100) : 0,
    latency: executions.length
      ? Math.round(executions.reduce((s, e) => s + e.durationMs, 0) / executions.length)
      : 0,
  };
}
export function volumeByDay(executions: Execution[], days = 7) {
  const anchor = executions.length
    ? Math.max(...executions.map((e) => Date.parse(e.startedAt)))
    : Date.now();
  const last = new Date(anchor);
  last.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(last.getTime() - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
    return {
      date,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      completed: executions.filter((e) => e.startedAt.startsWith(date) && e.status === 'completed')
        .length,
      failed: executions.filter((e) => e.startedAt.startsWith(date) && e.status === 'failed')
        .length,
    };
  });
}
export function dateLabel(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
