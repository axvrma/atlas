import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type NodeProps,
  type Node,
} from '@xyflow/react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Copy,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ExecutionLog,
  IconButton,
  Select,
  StatusIndicator,
  Tabs,
  WorkflowNode,
} from '@atlas/ui';
import type { WorkflowNode as NodeModel } from '@atlas/contracts';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { dateLabel } from '../features/analytics';
import '@xyflow/react/dist/style.css';
type DebugNode = Node<{ model: NodeModel; status?: string }, 'debug'>;
const DebugGraphNode = memo(function DebugGraphNode({ data, selected }: NodeProps<DebugNode>) {
  return (
    <>
      <Handle position={Position.Left} type="target" />
      <WorkflowNode node={data.model} status={data.status} selected={selected} />
      <Handle position={Position.Right} type="source" />
    </>
  );
});
const nodeTypes = { debug: DebugGraphNode };
export default function Debugger() {
  const { id } = useParams();
  const { data } = useWorkspace();
  const execution = data.executions.find((e) => e.id === id);
  if (!execution)
    return (
      <EmptyState
        title="Execution not found"
        description="This run may have been removed by a demo reset or history retention."
        action={
          <Link className="button" to="/app/executions">
            Execution history
          </Link>
        }
      />
    );
  return <DebuggerContent key={id} execution={execution} />;
}
function DebuggerContent({ execution }: { execution: import('@atlas/contracts').Execution }) {
  const { data, run, notify } = useWorkspace();
  const navigate = useNavigate();
  const traces = useMemo(() => execution.traces.filter((t) => t.status !== 'skipped'), [execution]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState('output');
  const [compare, setCompare] = useState('');
  const [replaying, setReplaying] = useState(false);
  const trace = traces[index];
  const comparison = data.executions.find((e) => e.id === compare);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setIndex((i) => {
          if (i >= traces.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        }),
      1000 / speed,
    );
    return () => clearInterval(timer);
  }, [playing, speed, traces.length]);
  const snapshot = execution.snapshot;
  const nodes = snapshot.nodes.map((n) => {
    const step = traces.findIndex((t) => t.nodeId === n.id);
    return {
      id: n.id,
      type: 'debug' as const,
      position: n.position,
      data: { model: n, status: step >= 0 && step <= index ? traces[step]?.status : 'skipped' },
      selected: n.id === trace?.nodeId,
    };
  });
  const edges = snapshot.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    label: e.branch,
    style: {
      stroke: traces
        .slice(0, index + 1)
        .some((t) => t.nodeId === e.source && (!e.branch || t.branch === e.branch))
        ? 'var(--green)'
        : 'var(--border)',
    },
    labelStyle: { fill: 'var(--muted)', fontSize: 10 },
  }));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(tab === 'input' ? trace?.input : trace?.output, null, 2),
      );
      notify('Payload copied to clipboard.');
    } catch {
      notify('Clipboard is unavailable. Select the payload text to copy it.');
    }
  };
  return (
    <div className="debugger">
      <div className="page-heading">
        <div>
          <Link className="back-link" to="/app/executions">
            <ArrowLeft size={12} />
            Execution history
          </Link>
          <h1>{execution.workflowName}</h1>
          <p className="mono" style={{ fontSize: 11, marginTop: 8 }}>
            {execution.id}
          </p>
        </div>
        <div className="row">
          <StatusIndicator status={execution.status} />
          <Button
            loading={replaying}
            onClick={async () => {
              setReplaying(true);
              try {
                const replay = await run(snapshot, execution.input);
                navigate(`/app/executions/${replay.id}`);
              } catch (e) {
                notify(e instanceof Error ? e.message : 'Replay failed.');
              } finally {
                setReplaying(false);
              }
            }}
          >
            <RotateCcw size={13} />
            Replay simulation
          </Button>
          <Link className="button" to={`/app/workflows/${execution.workflowId}`}>
            Open editor
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
      <div className="execution-metadata">
        <span>
          Started <strong>{dateLabel(execution.startedAt)}</strong>
        </span>
        <span>
          Duration <strong>{execution.durationMs} ms simulated</strong>
        </span>
        <span>
          Source <Badge>{execution.source === 'seeded' ? 'Seeded sample' : 'Local run'}</Badge>
        </span>
        <span>
          Seed <code>{execution.seed}</code>
        </span>
        <span>
          {traces.length} executed · {execution.traces.length - traces.length} skipped
        </span>
      </div>
      {execution.error && <Alert tone="error">{execution.error}</Alert>}
      <div className="debugger-layout">
        <section className="debug-timeline surface">
          <div className="panel-header">
            <h3>Execution path</h3>
            <Badge>
              {index + 1}/{traces.length}
            </Badge>
          </div>
          <ol>
            {traces.map((t, i) => (
              <li key={t.nodeId}>
                <button
                  onClick={() => {
                    setIndex(i);
                    setPlaying(false);
                  }}
                  className={i === index ? 'active' : ''}
                >
                  <span className={`step-number ${t.status}`}>{i + 1}</span>
                  <span>
                    <strong>{t.nodeName}</strong>
                    <small>
                      {t.durationMs} ms · {t.status}
                    </small>
                  </span>
                  <ChevronRight size={12} />
                </button>
              </li>
            ))}
          </ol>
          <details className="skipped-nodes">
            <summary>{execution.traces.length - traces.length} skipped nodes</summary>
            {execution.traces
              .filter((t) => t.status === 'skipped')
              .map((t) => (
                <p key={t.nodeId}>{t.nodeName}</p>
              ))}
          </details>
        </section>
        <section className="debug-main surface">
          <div className="debug-graph">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              onNodeClick={(_, n) => {
                const i = traces.findIndex((t) => t.nodeId === n.id);
                if (i >= 0) setIndex(i);
              }}
              fitView
              minZoom={0.15}
              maxZoom={1.5}
              colorMode={data.preferences.theme}
            >
              <Background gap={22} color="var(--border)" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
          <div className="playback-controls">
            <div className="row">
              <IconButton
                label="Restart playback"
                onClick={() => {
                  setIndex(0);
                  setPlaying(false);
                }}
              >
                <SkipBack size={15} />
              </IconButton>
              <IconButton
                label="Previous step"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
              >
                <ArrowLeft size={15} />
              </IconButton>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  if (index === traces.length - 1) setIndex(0);
                  setPlaying((v) => !v);
                }}
              >
                {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? 'Pause' : 'Play'}
              </Button>
              <IconButton
                label="Next step"
                disabled={index >= traces.length - 1}
                onClick={() => setIndex((i) => i + 1)}
              >
                <SkipForward size={15} />
              </IconButton>
            </div>
            <span>
              Step {index + 1} of {traces.length}
            </span>
            <Select
              aria-label="Playback speed"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </Select>
          </div>
          <div className="debug-payload">
            <div className="row spread">
              <div className="row">
                <h3>{trace?.nodeName ?? 'No steps'}</h3>
                {trace && <StatusIndicator status={trace.status} />}
              </div>
              <IconButton label="Copy selected payload" onClick={() => void copy()}>
                <Copy size={14} />
              </IconButton>
            </div>
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'input', label: 'Input' },
                { value: 'output', label: 'Output' },
                { value: 'logs', label: 'Logs & errors' },
              ]}
            />
            <div className="json-view">
              {tab === 'logs' ? (
                <>
                  {trace?.error && <Alert tone="error">{trace.error}</Alert>}
                  <ExecutionLog logs={trace?.logs ?? []} />
                </>
              ) : (
                <pre tabIndex={0} aria-label={`${tab} payload`}>
                  {JSON.stringify(
                    tab === 'input'
                      ? trace?.input
                      : (trace?.output ?? { error: trace?.error ?? 'No output produced' }),
                    null,
                    2,
                  )}
                </pre>
              )}
            </div>
          </div>
        </section>
      </div>
      <section className="card execution-compare">
        <div>
          <h3>Compare outcomes</h3>
          <p>Inspect another run of the same workflow.</p>
        </div>
        <Select
          aria-label="Compare with execution"
          value={compare}
          onChange={(e) => setCompare(e.target.value)}
        >
          <option value="">Select a run…</option>
          {data.executions
            .filter((e) => e.id !== execution.id && e.workflowId === execution.workflowId)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.status} · {e.id.slice(0, 12)} · {e.durationMs} ms
              </option>
            ))}
        </Select>
        {comparison && (
          <div className="comparison-result">
            <div>
              <StatusIndicator status={execution.status} />
              <span>
                {execution.durationMs} ms · {traces.length} steps
              </span>
            </div>
            <span>→</span>
            <div>
              <StatusIndicator status={comparison.status} />
              <span>
                {comparison.durationMs} ms ·{' '}
                {comparison.traces.filter((t) => t.status !== 'skipped').length} steps
              </span>
            </div>
            <Link className="text-link" to={`/app/executions/${comparison.id}`}>
              Inspect run
              <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
