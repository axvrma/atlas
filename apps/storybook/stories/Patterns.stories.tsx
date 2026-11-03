import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, Card, MetricCard, NodeIcon, StatusIndicator } from '@atlas/ui';
const meta = {
  title: 'Patterns/Workspace compositions',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;
export default meta;
export const WorkflowCard: StoryObj<typeof meta> = {
  render: () => (
    <Card style={{ maxWidth: 350 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <NodeIcon kind="trigger" />
        <StatusIndicator status="ready" />
      </div>
      <h3>Customer Support Triage</h3>
      <p style={{ fontSize: 12, margin: '10px 0 20px' }}>
        Route support requests using deterministic local rules.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Badge>8 nodes</Badge>
        <Button variant="primary" size="sm">
          Open workflow
        </Button>
      </div>
    </Card>
  ),
};
export const WorkspaceMetrics: StoryObj<typeof meta> = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 15,
      }}
    >
      <MetricCard label="Sample workflows" value={5} note="Illustrative composition" />
      <MetricCard label="Simulated executions" value={25} note="Illustrative composition" />
      <MetricCard label="Storage" value="Local" note="No backend needed" />
    </div>
  ),
};
