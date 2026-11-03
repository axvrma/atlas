import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  GitBranch,
  LayoutGrid,
  List,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {
  nodeMeta,
  payloadSchema,
  type Execution,
  type NodeKind,
  type Payload,
  type Workflow,
  type WorkflowNode as NodeModel,
} from '@atlas/contracts';
import { defaultConfig, validateGraph } from '@atlas/core';
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  CanvasToolbar,
  EmptyState,
  FormField,
  IconButton,
  Input,
  NodeInspector,
  NodePalette,
  Select,
  StatusIndicator,
  Switch,
  Textarea,
  WorkflowNode,
} from '@atlas/ui';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { useGraphHistory } from '../hooks/useGraphHistory';
import { downloadJson } from '../services/storage';
import '@xyflow/react/dist/style.css';

type AtlasNode = Node<{ model: NodeModel; status?: string }, 'atlas'>;
const CanvasNode = memo(function CanvasNode({ data, selected }: NodeProps<AtlasNode>) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <WorkflowNode node={data.model} selected={selected} status={data.status} />
      {data.model.kind !== 'end' &&
        (data.model.kind === 'condition' ? (
          <>
            <Handle
              type="source"
              id="true"
              position={Position.Right}
              style={{ top: '35%', background: 'var(--green)' }}
            />
            <Handle
              type="source"
              id="false"
              position={Position.Right}
              style={{ top: '75%', background: 'var(--amber)' }}
            />
            <span className="branch-handle true">T</span>
            <span className="branch-handle false">F</span>
          </>
        ) : (
          <Handle type="source" position={Position.Right} />
        ))}
    </>
  );
});
const nodeTypes = { atlas: CanvasNode };
export default function Editor() {
  const { id } = useParams();
  const { data } = useWorkspace();
  const workflow = data.workflows.find((w) => w.id === id);
  if (!workflow)
    return (
      <EmptyState
        title="This workflow isn’t here"
        description="It may have been deleted in this browser. Your other workflows are still in the library."
        action={
          <Link className="button" to="/app/workflows">
            Open library
          </Link>
        }
      />
    );
  return (
    <ReactFlowProvider key={id}>
      <EditorContent initial={workflow} />
    </ReactFlowProvider>
  );
}
function EditorContent({ initial }: { initial: Workflow }) {
  const { updateWorkflow, data, setPreferences, run, saveNow, notify } = useWorkspace();
  const openedGraph = useRef(structuredClone(initial));
  const { graph, commit, transient, undo, redo, canUndo, canRedo, current } =
    useGraphHistory(initial);
  const [selected, setSelected] = useState(initial.nodes[0]?.id);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [measurements, setMeasurements] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [panel, setPanel] = useState(true);
  const [listView, setListView] = useState(() => matchMedia('(max-width: 640px)').matches);
  const [inspector, setInspector] = useState(() => !matchMedia('(max-width: 640px)').matches);
  const [input, setInput] = useState(JSON.stringify(initial.sampleInput, null, 2));
  const [scenario, setScenario] = useState('sample');
  const [execution, setExecution] = useState<Execution>();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState(initial.nodes[0]?.id ?? '');
  const [target, setTarget] = useState(initial.nodes.at(-1)?.id ?? '');
  const [branch, setBranch] = useState('true');
  const [reset, setReset] = useState(false);
  const clipboard = useRef<NodeModel[]>([]);
  const dragStart = useRef<Workflow | null>(null);
  const abort = useRef<AbortController | undefined>(undefined);
  const rf = useReactFlow<AtlasNode>();
  const diagnostics = useMemo(() => validateGraph(graph), [graph]);
  useEffect(() => {
    updateWorkflow(graph);
  }, [graph, updateWorkflow]);
  useEffect(() => () => abort.current?.abort(), []);
  const selectedNode = graph.nodes.find((n) => n.id === selected);
  const remove = useCallback(
    (ids: string[]) => {
      const old = current.current;
      commit({
        ...old,
        nodes: old.nodes.filter((n) => !ids.includes(n.id)),
        edges: old.edges.filter((e) => !ids.includes(e.source) && !ids.includes(e.target)),
      });
      setSelected(undefined);
    },
    [commit, current],
  );
  const add = useCallback(
    (kind: NodeKind) => {
      const old = current.current;
      const id = crypto.randomUUID();
      const last = old.nodes.at(-1);
      const node: NodeModel = {
        id,
        kind,
        name: nodeMeta[kind].label,
        description: nodeMeta[kind].description,
        config: defaultConfig(kind),
        position: { x: (last?.position.x ?? 0) + 80, y: (last?.position.y ?? 0) + 150 },
      };
      commit({ ...old, nodes: [...old.nodes, node] });
      setSelected(id);
      setInspector(true);
      setTimeout(() => rf.fitView({ duration: 200, padding: 0.2 }), 50);
    },
    [commit, current, rf],
  );
  const paste = useCallback(() => {
    if (!clipboard.current.length) return;
    const old = current.current;
    const clones = clipboard.current.map((n) => ({
      ...structuredClone(n),
      id: crypto.randomUUID(),
      name: `${n.name} copy`,
      position: { x: n.position.x + 60, y: n.position.y + 140 },
    }));
    commit({ ...old, nodes: [...old.nodes, ...clones] });
    setSelected(clones[0]?.id);
  }, [commit, current]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (mod && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if (mod && e.key === 's') {
        e.preventDefault();
        void saveNow().then(() => notify('Workspace saved to browser storage.'));
      }
      if (mod && ['c', 'd'].includes(e.key)) {
        e.preventDefault();
        clipboard.current = current.current.nodes.filter(
          (n) => selectedIds.includes(n.id) || n.id === selected,
        );
        if (e.key === 'd') paste();
      }
      if (mod && e.key === 'v') {
        e.preventDefault();
        paste();
      }
      if (e.key === 'Escape') setSelected(undefined);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [undo, redo, saveNow, notify, current, selected, selectedIds, paste]);
  const selectionChange = useCallback(({ nodes }: { nodes: AtlasNode[] }) => {
    const ids = nodes.map((n) => n.id);
    setSelectedIds((previous) =>
      previous.length === ids.length && previous.every((id, i) => id === ids[i]) ? previous : ids,
    );
  }, []);
  const nodes = useMemo(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: 'atlas' as const,
        position: n.position,
        initialWidth: 228,
        initialHeight: 110,
        measured: measurements[n.id],
        data: { model: n, status: execution?.traces.find((t) => t.nodeId === n.id)?.status },
        selected: selectedIds.includes(n.id) || n.id === selected,
      })),
    [graph.nodes, selected, selectedIds, execution, measurements],
  );
  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => {
        const active = execution?.traces.some(
          (t) =>
            t.nodeId === e.source &&
            t.status === 'completed' &&
            (!e.branch || t.branch === e.branch),
        );
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.branch,
          label: e.branch,
          type: 'smoothstep',
          animated: running,
          style: {
            stroke: active ? 'var(--green)' : 'var(--slate)',
            strokeWidth: active ? 2 : 1.5,
          },
          labelStyle: { fill: 'var(--muted)', fontSize: 10 },
          labelBgStyle: { fill: 'var(--bg)' },
        };
      }),
    [graph.edges, execution, running],
  );
  const connect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return;
      const old = current.current;
      if (
        old.edges.some(
          (e) =>
            e.source === c.source &&
            e.target === c.target &&
            e.branch === (c.sourceHandle ?? undefined),
        )
      )
        return;
      commit({
        ...old,
        edges: [
          ...old.edges,
          {
            id: crypto.randomUUID(),
            source: c.source,
            target: c.target,
            ...(c.sourceHandle === 'true' || c.sourceHandle === 'false'
              ? { branch: c.sourceHandle }
              : {}),
          },
        ],
      });
    },
    [commit, current],
  );
  const changes = useCallback(
    (changes: NodeChange<AtlasNode>[]) => {
      let next = current.current;
      let removed = false;
      const measured: Record<string, { width: number; height: number }> = {};
      for (const change of changes) {
        if (change.type === 'dimensions' && change.dimensions) {
          measured[change.id] = change.dimensions;
        }
        if (change.type === 'position' && change.position)
          next = {
            ...next,
            nodes: next.nodes.map((n) =>
              n.id === change.id ? { ...n, position: change.position! } : n,
            ),
          };
        if (change.type === 'remove') {
          next = {
            ...next,
            nodes: next.nodes.filter((n) => n.id !== change.id),
            edges: next.edges.filter((e) => e.source !== change.id && e.target !== change.id),
          };
          removed = true;
        }
      }
      if (Object.keys(measured).length) {
        setMeasurements((previous) => {
          const changed = Object.entries(measured).some(
            ([id, size]) =>
              previous[id]?.width !== size.width || previous[id]?.height !== size.height,
          );
          return changed ? { ...previous, ...measured } : previous;
        });
      }
      if (next !== current.current) {
        if (removed) commit(next);
        else transient(next);
      }
    },
    [current, commit, transient],
  );
  const autoLayout = () => {
    const layout = new dagre.graphlib.Graph();
    layout.setGraph({ rankdir: 'LR', nodesep: 85, ranksep: 95 });
    layout.setDefaultEdgeLabel(() => ({}));
    graph.nodes.forEach((n) => layout.setNode(n.id, { width: 228, height: 110 }));
    graph.edges.forEach((e) => layout.setEdge(e.source, e.target));
    dagre.layout(layout);
    commit({
      ...graph,
      nodes: graph.nodes.map((n) => {
        const position = layout.node(n.id);
        return { ...n, position: { x: position.x - 114, y: position.y - 55 } };
      }),
    });
    setTimeout(() => rf.fitView({ duration: 300, padding: 0.15 }), 50);
  };
  const start = async () => {
    setPanel(true);
    setError('');
    try {
      const payload = payloadSchema.parse(JSON.parse(input) as unknown) as Payload;
      const snapshot = structuredClone(graph);
      snapshot.sampleInput = payload;
      if (scenario === 'failure') {
        const http = snapshot.nodes.find((n) => n.kind === 'http');
        if (!http) throw Error('Add an HTTP node to use the failure fixture.');
        http.config.fixture = 'unavailable';
      }
      abort.current = new AbortController();
      setRunning(true);
      const result = await run(snapshot, payload, abort.current.signal);
      setExecution(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation could not start.');
    } finally {
      setRunning(false);
    }
  };
  return (
    <div className="editor">
      <h1 className="sr-only">{graph.name} workflow editor</h1>
      <div className="editor-top">
        <div className="row">
          <Link to="/app/workflows" className="icon-button" aria-label="Back to workflows">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <Input
              className="workflow-name-input"
              aria-label="Workflow name"
              value={graph.name}
              maxLength={100}
              onChange={(e) => commit({ ...graph, name: e.target.value })}
            />
            <span className="editor-save-state">
              <span className="live-dot" /> Changes saved automatically
            </span>
          </div>
          <Select
            className="editor-status"
            aria-label="Workflow status"
            value={graph.status}
            onChange={(e) => commit({ ...graph, status: e.target.value as Workflow['status'] })}
          >
            <option value="ready">Ready</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <div className="row">
          <IconButton label="Undo" disabled={!canUndo} onClick={undo}>
            <Undo2 size={16} />
          </IconButton>
          <IconButton label="Redo" disabled={!canRedo} onClick={redo}>
            <Redo2 size={16} />
          </IconButton>
          <Button
            size="sm"
            onClick={() => {
              void saveNow().then(() => notify('Workspace saved to browser storage.'));
            }}
          >
            <Save size={13} />
            Save
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPanel(true);
              void start();
            }}
            loading={running}
          >
            <Play size={13} />
            Run simulation
          </Button>
        </div>
      </div>
      <div className="editor-workarea">
        <aside className="editor-palette">
          <div className="panel-label">BUILD YOUR WORKFLOW</div>
          <h3>Node library</h3>
          <p>Click to add to the canvas.</p>
          <NodePalette onAdd={add} />
          <div className="palette-tip">
            <GitBranch size={17} />
            <p>Connect outputs to inputs. Conditions need a true and a false path.</p>
          </div>
          <button className="text-link" onClick={() => setListView((v) => !v)}>
            <List size={13} /> {listView ? 'Show canvas' : 'Accessible node list'}
          </button>
        </aside>
        <div className="editor-canvas">
          <div className="canvas-top">
            <div className="row">
              <Badge tone={diagnostics.length ? 'amber' : 'green'}>
                {diagnostics.length ? (
                  `${diagnostics.length} validation issues`
                ) : (
                  <>
                    <Check size={10} />
                    Graph valid
                  </>
                )}
              </Badge>
              <span className="canvas-node-count">
                {graph.nodes.length} nodes · {graph.edges.length} connections
              </span>
            </div>
            <div className="row">
              <IconButton
                label={listView ? 'Show canvas' : 'Show accessible node list'}
                onClick={() => setListView((v) => !v)}
              >
                <List size={15} />
              </IconButton>
              <IconButton label="Toggle inspector" onClick={() => setInspector((v) => !v)}>
                <LayoutGrid size={15} />
              </IconButton>
            </div>
          </div>
          {listView ? (
            <div className="accessible-graph">
              <h3>Nodes & connections</h3>
              <p>Use these controls to edit the complete graph without dragging.</p>
              {graph.nodes.map((n) => (
                <div key={n.id} className="accessible-node">
                  <button
                    onClick={() => {
                      setSelected(n.id);
                      setInspector(true);
                    }}
                  >
                    <span>{n.name}</span>
                    <Badge>{nodeMeta[n.kind].label}</Badge>
                  </button>
                  <ul>
                    {graph.edges
                      .filter((e) => e.source === n.id)
                      .map((e) => (
                        <li key={e.id}>
                          {e.branch && `${e.branch} → `}
                          {graph.nodes.find((n) => n.id === e.target)?.name ?? 'Missing node'}
                          <IconButton
                            label={`Remove connection ${e.id}`}
                            onClick={() =>
                              commit({ ...graph, edges: graph.edges.filter((x) => x.id !== e.id) })
                            }
                          >
                            <X size={12} />
                          </IconButton>
                        </li>
                      ))}
                  </ul>
                  <Button size="sm" variant="ghost" onClick={() => remove([n.id])}>
                    <Trash2 size={12} />
                    Remove node
                  </Button>
                </div>
              ))}
              <div className="connect-form">
                <h4>Add a connection</h4>
                <FormField label="From node">
                  <Select value={source} onChange={(e) => setSource(e.target.value)}>
                    {graph.nodes
                      .filter((n) => n.kind !== 'end')
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                  </Select>
                </FormField>
                {graph.nodes.find((n) => n.id === source)?.kind === 'condition' && (
                  <FormField label="Condition branch">
                    <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
                      <option>true</option>
                      <option>false</option>
                    </Select>
                  </FormField>
                )}
                <FormField label="To node">
                  <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                    {graph.nodes
                      .filter((n) => n.kind !== 'trigger')
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                  </Select>
                </FormField>
                <Button
                  onClick={() =>
                    connect({
                      source,
                      target,
                      sourceHandle:
                        graph.nodes.find((n) => n.id === source)?.kind === 'condition'
                          ? branch
                          : null,
                      targetHandle: null,
                    })
                  }
                >
                  <Plus size={12} />
                  Add connection
                </Button>
              </div>
            </div>
          ) : (
            <ReactFlow<AtlasNode>
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={changes}
              onNodeClick={(_, node) => {
                setSelected(node.id);
                setInspector(true);
              }}
              onSelectionChange={selectionChange}
              onEdgesDelete={(deleted) =>
                commit({
                  ...graph,
                  edges: graph.edges.filter((e) => !deleted.some((d) => d.id === e.id)),
                })
              }
              onConnect={connect}
              onNodeDragStart={() => {
                dragStart.current = structuredClone(current.current);
              }}
              onNodeDragStop={() => {
                if (dragStart.current) commit(current.current, dragStart.current);
                dragStart.current = null;
              }}
              fitView
              fitViewOptions={{
                padding: 0.18,
                nodes: initial.nodes.slice(0, 3).map((n) => ({ id: n.id })),
              }}
              minZoom={0.15}
              maxZoom={1.7}
              snapToGrid={data.preferences.snap}
              snapGrid={[20, 20]}
              deleteKeyCode={['Backspace', 'Delete']}
              multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
              colorMode={data.preferences.theme}
              proOptions={{ hideAttribution: false }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1}
                color="var(--border)"
              />
              <Controls showInteractive={false} />
              {data.preferences.minimap && (
                <MiniMap
                  style={{ width: 110, height: 70 }}
                  nodeColor="var(--brand)"
                  maskColor="color-mix(in srgb, var(--bg) 65%, transparent)"
                  maskStrokeColor="var(--brand)"
                  maskStrokeWidth={1.4}
                  pannable
                  zoomable
                />
              )}
            </ReactFlow>
          )}
          <div className="canvas-bottom">
            <CanvasToolbar>
              <Button size="sm" onClick={autoLayout}>
                <LayoutGrid size={12} />
                Auto-layout
              </Button>
              <Switch
                label="Snap"
                checked={data.preferences.snap}
                onChange={(e) => setPreferences({ snap: e.target.checked })}
              />
              <IconButton
                label="Toggle minimap"
                onClick={() => setPreferences({ minimap: !data.preferences.minimap })}
              >
                <LayoutGrid size={14} />
              </IconButton>
              <IconButton
                label="Export workflow JSON"
                onClick={() => downloadJson(graph, `${graph.name}.json`)}
              >
                <Download size={14} />
              </IconButton>
              <IconButton label="Reset graph to opened version" onClick={() => setReset(true)}>
                <RotateCcw size={14} />
              </IconButton>
            </CanvasToolbar>
          </div>
        </div>
        {inspector && (
          <aside className="editor-inspector">
            <div className="row spread">
              <div className="panel-label">NODE INSPECTOR</div>
              <IconButton label="Close inspector" onClick={() => setInspector(false)}>
                <X size={14} />
              </IconButton>
            </div>
            {selectedNode ? (
              <>
                <NodeInspector
                  key={selectedNode.id}
                  node={selectedNode}
                  onChange={(n) =>
                    commit({
                      ...graph,
                      nodes: graph.nodes.map((old) => (old.id === n.id ? n : old)),
                    })
                  }
                  diagnostics={diagnostics
                    .filter((d) => d.nodeId === selectedNode.id)
                    .map((d) => d.message)}
                />
                <div className="inspector-actions">
                  <Button
                    size="sm"
                    onClick={() => {
                      clipboard.current = [selectedNode];
                      paste();
                    }}
                  >
                    <Copy size={12} />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove([selectedNode.id])}>
                    <Trash2 size={12} />
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState
                title="Select a node"
                description="Choose a node on the canvas to edit its behavior."
              />
            )}
          </aside>
        )}
      </div>
      <div className={`simulation-panel ${panel ? 'expanded' : ''}`}>
        <div className="simulation-header">
          <button onClick={() => setPanel((v) => !v)} aria-expanded={panel}>
            <Play size={13} />
            <strong>Simulation lab</strong>
            <Badge>Local execution</Badge>
            {panel ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          {execution && (
            <div className="row">
              <StatusIndicator status={execution.status} />
              <Link className="text-link" to={`/app/executions/${execution.id}`}>
                Open debugger
                <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
        {panel && (
          <div className="simulation-body">
            <div className="simulation-input">
              <div className="row spread">
                <label htmlFor="event-json">INPUT EVENT</label>
                <Select
                  aria-label="Simulation scenario"
                  value={scenario}
                  onChange={(e) => {
                    setScenario(e.target.value);
                    if (e.target.value === 'sample')
                      setInput(JSON.stringify(graph.sampleInput, null, 2));
                    if (e.target.value === 'alternate') {
                      const next = { ...graph.sampleInput };
                      const rule = graph.nodes.find((n) => n.kind === 'condition');
                      if (rule?.config.field)
                        next[rule.config.field] =
                          typeof rule.config.value === 'number' ? 0 : 'standard';
                      setInput(JSON.stringify(next, null, 2));
                    }
                  }}
                >
                  <option value="sample">Sample event</option>
                  <option value="alternate">Alternate branch</option>
                  <option value="failure">HTTP failure fixture</option>
                </Select>
              </div>
              <Textarea
                id="event-json"
                className="code-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
              />
              <div className="row">
                <Button size="sm" variant="primary" disabled={running} onClick={() => void start()}>
                  <Play size={12} />
                  Run event
                </Button>
                {running && (
                  <Button size="sm" onClick={() => abort.current?.abort()}>
                    <Square size={11} />
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    try {
                      const payload = payloadSchema.parse(JSON.parse(input) as unknown);
                      commit({ ...graph, sampleInput: payload });
                      setError('');
                      notify('Sample input updated.');
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Invalid input.');
                    }
                  }}
                >
                  Use as sample
                </Button>
              </div>
            </div>
            <div className="simulation-output">
              {error ? (
                <Alert tone="error">{error}</Alert>
              ) : diagnostics.length ? (
                <>
                  <div className="panel-label">GRAPH DIAGNOSTICS</div>
                  <ul className="diagnostics">
                    {diagnostics.map((d, i) => (
                      <li key={`${d.code}-${i}`}>
                        <button
                          onClick={() => {
                            setSelected(d.nodeId);
                            setInspector(true);
                          }}
                        >
                          {d.message}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : execution ? (
                <>
                  <div className="row spread">
                    <div className="panel-label">EXECUTION TRACE</div>
                    <span className="muted mono">{execution.durationMs} ms simulated</span>
                  </div>
                  <div className="trace-chips">
                    {execution.traces.map((t) => (
                      <button
                        key={t.nodeId}
                        onClick={() => {
                          setSelected(t.nodeId);
                          setInspector(true);
                        }}
                        className={`trace-chip ${t.status}`}
                      >
                        <span>{t.nodeName}</span>
                        <small>
                          {t.status} · {t.durationMs} ms
                        </small>
                      </button>
                    ))}
                  </div>
                  {execution.error && <p className="validation">{execution.error}</p>}
                </>
              ) : (
                <div className="simulation-empty">
                  <Play size={23} strokeWidth={1.3} />
                  <h4>Every run tells a story.</h4>
                  <p>Run a sample event to see the path it takes through your workflow.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <AlertDialog
        open={reset}
        onOpenChange={setReset}
        title="Restore the opened graph?"
        description="Revert graph edits from this editor session. You can undo this action."
        confirmLabel="Restore graph"
        onConfirm={() => commit(structuredClone(openedGraph.current))}
      />
    </div>
  );
}
