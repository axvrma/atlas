import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Avatar,
  Badge,
  Card,
  DataTable,
  ExecutionLog,
  MetricCard,
  StatusIndicator,
  Timeline,
} from '@atlas/ui';
const meta = {
  title: 'Data Display/Execution evidence',
  component: MetricCard,
  args: { label: 'Metric', value: 0, note: 'Example' },
  tags: ['autodocs'],
} satisfies Meta<typeof MetricCard>;
export default meta;
export const DataCompositions: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Avatar />
        <Badge tone="purple">Demo workspace</Badge>
        {['pending', 'running', 'completed', 'failed', 'cancelled'].map((s) => (
          <StatusIndicator key={s} status={s} />
        ))}
      </div>
      <MetricCard
        label="Example simulated duration"
        value="142 ms"
        note="Illustrative component data"
      />
      <Card>
        <DataTable
          caption="Illustrative execution data"
          rows={[
            { id: 'example-1', name: 'Support triage', status: 'completed' },
            { id: 'example-2', name: 'Risk assessment', status: 'failed' },
          ]}
          rowKey={(r) => r.id}
          columns={[
            { label: 'WORKFLOW', render: (r) => r.name },
            { label: 'STATUS', render: (r) => <StatusIndicator status={r.status} /> },
          ]}
        />
      </Card>
      <Timeline
        items={[
          { title: 'Event accepted', detail: <p>Trigger received the sample payload.</p> },
          { title: 'Condition matched', detail: <p>Enterprise branch selected.</p> },
        ]}
      />
      <ExecutionLog
        logs={[
          'Sample event accepted.',
          'customerTier equals → true',
          'Simulated notification recorded.',
        ]}
      />
    </div>
  ),
};
