import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  Braces,
  Check,
  CheckCircle2,
  Clock3,
  GitBranch,
  Globe2,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  configSchema,
  nodeKinds,
  nodeMeta,
  type NodeKind,
  type WorkflowNode as NodeModel,
  type NodeConfig,
} from '@atlas/contracts';
import { Alert, Button } from './primitives';
import { FormField, Input, Select, Textarea, ValidationMessage } from './forms';

const icons = {
  trigger: Zap,
  condition: GitBranch,
  transform: Braces,
  delay: Clock3,
  notification: Bell,
  http: Globe2,
  classifier: Sparkles,
  end: CheckCircle2,
};
export function NodeIcon({ kind, size = 17 }: { kind: NodeKind; size?: number }) {
  const Icon = icons[kind];
  return (
    <span className={`node-icon node-icon-${nodeMeta[kind].color}`}>
      <Icon size={size} strokeWidth={1.7} />
    </span>
  );
}
export function WorkflowNode({
  node,
  selected = false,
  status,
}: {
  node: NodeModel;
  selected?: boolean;
  status?: string;
}) {
  return (
    <div
      className={`workflow-node ${selected ? 'selected' : ''} ${status ? `status-${status}` : ''}`}
    >
      <div className="node-heading">
        <NodeIcon kind={node.kind} />
        <div>
          <div className="node-name">{node.name}</div>
          <div className="node-type">
            {nodeMeta[node.kind].label}
            {node.kind === 'classifier' ? ' · simulated' : ''}
          </div>
        </div>
        {status === 'completed' && (
          <Check size={12} style={{ color: 'var(--green)', marginLeft: 'auto' }} />
        )}
      </div>
      <div className="node-caption">
        {node.kind === 'condition'
          ? `${node.config.field} ${node.config.operator} ${JSON.stringify(node.config.value)}`
          : nodeMeta[node.kind].description}
      </div>
    </div>
  );
}
export function WorkflowEdge({ path, active = false }: { path: string; active?: boolean }) {
  return (
    <path d={path} fill="none" stroke={active ? 'var(--brand)' : 'var(--border)'} strokeWidth={2} />
  );
}
export function ConnectionHandle() {
  return <span className="connection-handle" />;
}
export function NodePalette({ onAdd }: { onAdd: (kind: NodeKind) => void }) {
  return (
    <div className="node-palette">
      {nodeKinds.map((kind) => (
        <button
          type="button"
          className="palette-item"
          key={kind}
          onClick={() => onAdd(kind)}
          title={`Add ${nodeMeta[kind].label} node`}
        >
          <NodeIcon kind={kind} />
          <span>
            <span className="sr-only">Add </span>
            <strong>{nodeMeta[kind].label}</strong>
            <small>{nodeMeta[kind].description}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
export function NodeInspector({
  node,
  onChange,
  diagnostics = [],
}: {
  node: NodeModel;
  onChange: (node: NodeModel) => void;
  diagnostics?: string[];
}) {
  const [configText, setConfigText] = useState(JSON.stringify(node.config, null, 2));
  const [comparisonText, setComparisonText] = useState(JSON.stringify(node.config.value));
  const [error, setError] = useState('');
  useEffect(() => {
    setConfigText(JSON.stringify(node.config, null, 2));
    setComparisonText(JSON.stringify(node.config.value));
  }, [node.config]);
  const changeConfig = (patch: Partial<NodeConfig>) => {
    const next = { ...node.config, ...patch };
    onChange({ ...node, config: next });
    setConfigText(JSON.stringify(next, null, 2));
  };
  return (
    <div className="node-inspector">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 22 }}>
        <NodeIcon kind={node.kind} />
        <div>
          <h3>{nodeMeta[node.kind].label}</h3>
          <code style={{ fontSize: 10, color: 'var(--muted)' }}>{node.id}</code>
        </div>
      </div>
      <FormField label="Node name">
        <Input
          value={node.name}
          maxLength={100}
          onChange={(e) => onChange({ ...node, name: e.target.value })}
        />
      </FormField>
      <FormField label="Description">
        <Textarea
          value={node.description}
          onChange={(e) => onChange({ ...node, description: e.target.value })}
        />
      </FormField>
      {(node.kind === 'condition' || node.kind === 'classifier') && (
        <FormField label="Input field">
          <Input
            value={node.config.field ?? ''}
            onChange={(e) => changeConfig({ field: e.target.value })}
          />
        </FormField>
      )}
      {node.kind === 'condition' && (
        <>
          <FormField label="Operator">
            <Select
              value={node.config.operator ?? 'equals'}
              onChange={(e) => changeConfig({ operator: e.target.value as NodeConfig['operator'] })}
            >
              {['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'exists'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Compare with (JSON value)" hint="Strings need quotes; numbers do not.">
            <Input
              value={comparisonText}
              onChange={(event) => setComparisonText(event.target.value)}
              onBlur={(e) => {
                try {
                  changeConfig({ value: JSON.parse(e.target.value) as NodeConfig['value'] });
                  setError('');
                } catch {
                  setError('Comparison must be a JSON value, such as "enterprise" or 1000.');
                }
              }}
            />
          </FormField>
        </>
      )}
      {node.kind === 'http' && (
        <>
          <FormField label="Local response fixture">
            <Select
              value={node.config.fixture ?? 'success'}
              onChange={(e) => changeConfig({ fixture: e.target.value as NodeConfig['fixture'] })}
            >
              <option value="success">200 · Success</option>
              <option value="unavailable">503 · Service unavailable</option>
              <option value="retry-success">503 then 200 · Retry success</option>
            </Select>
          </FormField>
          <FormField label="Maximum retries">
            <Input
              type="number"
              min={0}
              max={3}
              value={node.config.retries ?? 0}
              onChange={(e) => changeConfig({ retries: Number(e.target.value) })}
            />
          </FormField>
        </>
      )}
      {node.kind === 'delay' && (
        <FormField label="Simulated delay (ms)">
          <Input
            type="number"
            min={0}
            max={86400000}
            value={node.config.durationMs ?? 0}
            onChange={(e) => changeConfig({ durationMs: Number(e.target.value) })}
          />
        </FormField>
      )}
      {node.kind === 'notification' && (
        <>
          <FormField label="Channel">
            <Input
              value={node.config.channel ?? ''}
              onChange={(e) => changeConfig({ channel: e.target.value })}
            />
          </FormField>
          <FormField label="Message">
            <Textarea
              value={node.config.message ?? ''}
              onChange={(e) => changeConfig({ message: e.target.value })}
            />
          </FormField>
        </>
      )}
      {node.kind === 'classifier' && (
        <>
          <FormField label="Match keywords (comma separated)">
            <Input
              value={node.config.keywords ?? ''}
              onChange={(e) => changeConfig({ keywords: e.target.value })}
            />
          </FormField>
          <FormField label="Matched category">
            <Input
              value={node.config.category ?? ''}
              onChange={(e) => changeConfig({ category: e.target.value })}
            />
          </FormField>
          <Alert>Deterministic keyword rules. No AI model is connected.</Alert>
        </>
      )}
      <FormField
        label="Configuration JSON"
        hint={
          node.kind === 'transform'
            ? 'Assignments: literals or $.field references. Apply to validate.'
            : 'Advanced configuration. Apply to validate.'
        }
      >
        <Textarea
          className="code-input"
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          aria-invalid={Boolean(error)}
          rows={6}
        />
      </FormField>
      <Button
        size="sm"
        onClick={() => {
          try {
            const next = configSchema.parse(JSON.parse(configText) as unknown);
            onChange({ ...node, config: next });
            setError('');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid configuration.');
          }
        }}
      >
        Apply configuration
      </Button>
      {error && <ValidationMessage>{error}</ValidationMessage>}
      <hr />
      <h4 style={{ fontSize: 11, marginBottom: 10 }}>Validation</h4>
      {diagnostics.length ? (
        diagnostics.map((d) => (
          <p className="validation" key={d}>
            {d}
          </p>
        ))
      ) : (
        <p style={{ fontSize: 11, color: 'var(--green)' }}>✓ Configuration is valid</p>
      )}
      <hr />
      <details>
        <summary style={{ fontSize: 11, cursor: 'pointer' }}>Input / output contract</summary>
        <p style={{ fontSize: 11, marginTop: 8 }}>
          Input: JSON object propagated from the previous node.{' '}
          {node.kind === 'transform'
            ? 'Output: input plus assignment fields.'
            : node.kind === 'http'
              ? 'Output: input plus httpResponse.'
              : node.kind === 'classifier'
                ? 'Output: input plus category and classification.'
                : node.kind === 'notification'
                  ? 'Output: input plus notifications array.'
                  : 'Output: unchanged payload.'}
        </p>
        <p style={{ fontSize: 11, marginTop: 8 }}>{node.description}</p>
      </details>
    </div>
  );
}
export function CanvasToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Canvas controls">
      {children}
    </div>
  );
}
export function GraphMiniMap({ nodes }: { nodes: NodeModel[] }) {
  const maxX = Math.max(...nodes.map((n) => n.position.x), 1) + 240;
  const maxY = Math.max(...nodes.map((n) => n.position.y), 1) + 120;
  return (
    <svg
      width="150"
      height="80"
      viewBox={`0 0 ${maxX} ${maxY}`}
      aria-label="Workflow overview"
      role="img"
    >
      {nodes.map((n) => (
        <rect
          key={n.id}
          x={n.position.x}
          y={n.position.y}
          width={220}
          height={100}
          rx={8}
          fill="var(--brand)"
          opacity={0.45}
        />
      ))}
    </svg>
  );
}
