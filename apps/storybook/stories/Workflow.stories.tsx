import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { nodeKinds, nodeMeta, type WorkflowNode as NodeModel } from '@atlas/contracts';
import {
  CanvasToolbar,
  ConnectionHandle,
  GraphMiniMap,
  NodeInspector,
  NodePalette,
  WorkflowEdge,
  WorkflowNode,
} from '@atlas/ui';
const meta = {
  title: 'Workflow Components/Graph toolkit',
  component: WorkflowNode,
  args: {
    node: {
      id: 'example',
      kind: 'trigger',
      name: 'Sample event',
      description: 'A local event',
      position: { x: 0, y: 0 },
      config: {},
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorkflowNode>;
export default meta;
const nodes: NodeModel[] = nodeKinds.map((kind, i) => ({
  id: `example-${kind}`,
  kind,
  name: nodeMeta[kind].label,
  description: nodeMeta[kind].description,
  position: { x: i * 260, y: 0 },
  config:
    kind === 'condition' ? { field: 'customerTier', operator: 'equals', value: 'enterprise' } : {},
}));
export const NodeTypes: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
      {nodes.map((n) => (
        <WorkflowNode key={n.id} node={n} />
      ))}
    </div>
  ),
};
export const NodeStates: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
      {['completed', 'failed', 'skipped'].map((s) => (
        <WorkflowNode key={s} node={nodes[1]!} selected={s === 'completed'} status={s} />
      ))}
    </div>
  ),
};
function Toolkit() {
  const [node, setNode] = useState(nodes[1]!);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(250px,350px)', gap: 30 }}>
      <NodePalette onAdd={(kind) => setNode(nodes.find((n) => n.kind === kind)!)} />
      <NodeInspector key={node.id} node={node} onChange={setNode} />
      <GraphMiniMap nodes={nodes} />
      <CanvasToolbar>
        <ConnectionHandle />
        <svg width="100" height="25">
          <WorkflowEdge path="M0 12H100" active />
        </svg>
      </CanvasToolbar>
    </div>
  );
}
export const InteractiveInspector: StoryObj<typeof meta> = { render: () => <Toolkit /> };
