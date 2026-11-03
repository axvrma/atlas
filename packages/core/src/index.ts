import {
  payloadSchema,
  workflowSchema,
  type Diagnostic,
  type Execution,
  type ExecutionTrace,
  type JsonValue,
  type NodeConfig,
  type NodeKind,
  type Payload,
  type Workflow,
  type WorkflowNode,
} from '@atlas/contracts';

const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
export function validPath(path: string): boolean {
  return (
    /^[a-zA-Z_][\w]*(\.[a-zA-Z_][\w]*)*$/.test(path) &&
    path.split('.').every((p) => !forbidden.has(p))
  );
}
export function readPath(data: Payload, path: string): JsonValue | undefined {
  if (!validPath(path)) return undefined;
  let current: JsonValue | undefined = data;
  for (const part of path.split('.')) {
    if (current === null || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = Object.hasOwn(current, part) ? current[part] : undefined;
  }
  return current;
}
export function evaluateCondition(data: Payload, config: NodeConfig): boolean {
  const actual = readPath(data, config.field ?? '');
  switch (config.operator) {
    case 'equals':
      return JSON.stringify(actual) === JSON.stringify(config.value);
    case 'notEquals':
      return JSON.stringify(actual) !== JSON.stringify(config.value);
    case 'contains':
      return (
        typeof actual === 'string' &&
        typeof config.value === 'string' &&
        actual.toLowerCase().includes(config.value.toLowerCase())
      );
    case 'greaterThan':
      return (
        typeof actual === 'number' && typeof config.value === 'number' && actual > config.value
      );
    case 'lessThan':
      return (
        typeof actual === 'number' && typeof config.value === 'number' && actual < config.value
      );
    case 'exists':
      return actual !== undefined && actual !== null;
    default:
      return false;
  }
}
export function validateGraph(workflow: Workflow): Diagnostic[] {
  const parsed = workflowSchema.safeParse(workflow);
  if (!parsed.success)
    return parsed.error.issues.map((i) => ({
      code: 'schema',
      message: `${i.path.join('.')}: ${i.message}`,
    }));
  const errors: Diagnostic[] = [];
  const add = (code: string, message: string, nodeId?: string) =>
    errors.push({ code, message, nodeId });
  const byId = new Map(workflow.nodes.map((n) => [n.id, n]));
  if (byId.size !== workflow.nodes.length) add('duplicate-id', 'Node IDs must be unique.');
  if (new Set(workflow.edges.map((e) => e.id)).size !== workflow.edges.length)
    add('duplicate-edge', 'Connection IDs must be unique.');
  const triggers = workflow.nodes.filter((n) => n.kind === 'trigger');
  if (triggers.length !== 1) add('trigger', `Use exactly one trigger; found ${triggers.length}.`);
  const outgoing = new Map<string, typeof workflow.edges>();
  const incoming = new Map<string, number>();
  workflow.edges.forEach((e) => {
    if (!byId.has(e.source) || !byId.has(e.target))
      add('connection', 'A connection references a missing node.');
    outgoing.set(e.source, [...(outgoing.get(e.source) ?? []), e]);
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
  });
  for (const n of workflow.nodes) {
    const edges = outgoing.get(n.id) ?? [];
    if (n.kind === 'trigger' && incoming.has(n.id))
      add('entry', 'Trigger cannot have incoming connections.', n.id);
    if (n.kind !== 'trigger' && !incoming.has(n.id))
      add('entry', 'Connect this node to an upstream node.', n.id);
    if (n.kind === 'end' && edges.length)
      add('end', 'End nodes cannot have outgoing connections.', n.id);
    if (n.kind !== 'condition' && n.kind !== 'end' && edges.length !== 1)
      add('branch', 'Connect exactly one next node.', n.id);
    if (
      n.kind === 'condition' &&
      (edges.length !== 2 ||
        edges.filter((e) => e.branch === 'true').length !== 1 ||
        edges.filter((e) => e.branch === 'false').length !== 1)
    )
      add('paths', 'Condition requires one true path and one false path.', n.id);
    if (n.kind !== 'condition' && edges.some((e) => e.branch))
      add('branch', 'Branch labels are only supported on conditions.', n.id);
    if ((n.kind === 'condition' || n.kind === 'classifier') && !validPath(n.config.field ?? ''))
      add('field', 'Choose a valid payload field path.', n.id);
    if (
      n.kind === 'condition' &&
      (!n.config.operator || (n.config.operator !== 'exists' && n.config.value === undefined))
    )
      add('config', 'Condition needs an operator and comparison value.', n.id);
    if (n.kind === 'transform') {
      if (!n.config.assignments || !Object.keys(n.config.assignments).length)
        add('config', 'Provide at least one transform assignment.', n.id);
      Object.entries(n.config.assignments ?? {}).forEach(([key, val]) => {
        if (!validPath(key) || key.includes('.'))
          add('field', 'Transform destination must be a safe top-level field.', n.id);
        if (typeof val === 'string' && val.startsWith('$.') && !validPath(val.slice(2)))
          add('field', `Invalid field reference: ${val}`, n.id);
      });
    }
    if (n.kind === 'notification' && (!n.config.channel?.trim() || !n.config.message?.trim()))
      add('config', 'Notification needs a channel and message.', n.id);
    if (n.kind === 'http' && !n.config.fixture)
      add('config', 'Choose a local HTTP response fixture.', n.id);
    if (n.kind === 'delay' && n.config.durationMs === undefined)
      add('config', 'Set a simulated delay in milliseconds.', n.id);
    if (n.kind === 'classifier' && (!n.config.keywords?.trim() || !n.config.category?.trim()))
      add('config', 'Set classification keywords and category.', n.id);
  }
  // Iterative traversal avoids call-stack limits on imported graphs.
  const visited = new Set<string>();
  const queue = triggers.map((n) => n.id);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const e of outgoing.get(id) ?? []) queue.push(e.target);
  }
  workflow.nodes
    .filter((n) => !visited.has(n.id))
    .forEach((n) => add('disconnected', 'Node is unreachable from the trigger.', n.id));
  const degrees = new Map(workflow.nodes.map((n) => [n.id, incoming.get(n.id) ?? 0]));
  const ready = workflow.nodes.filter((n) => degrees.get(n.id) === 0).map((n) => n.id);
  let count = 0;
  // Propagate known fields through each ancestor path for useful reference diagnostics.
  const fields = new Map<string, Set<string>>();
  for (let i = 0; i < ready.length; i++) {
    const id = ready[i]!;
    const node = byId.get(id);
    if (!node) continue;
    count++;
    const known = fields.get(id) ?? new Set(Object.keys(workflow.sampleInput));
    const refs = [
      ...(node.config.field ? [node.config.field] : []),
      ...Object.values(node.config.assignments ?? {})
        .filter((v): v is string => typeof v === 'string' && v.startsWith('$.'))
        .map((v) => v.slice(2)),
    ];
    for (const ref of refs)
      if (validPath(ref) && !known.has(ref.split('.')[0]!))
        add(
          'reference',
          `Field “${ref}” is not defined in the sample input or upstream outputs.`,
          id,
        );
    Object.keys(node.config.assignments ?? {}).forEach((k) => known.add(k));
    if (node.kind === 'classifier') {
      known.add('category');
      known.add('classification');
    }
    if (node.kind === 'http') known.add('httpResponse');
    if (node.kind === 'notification') known.add('notifications');
    for (const edge of outgoing.get(id) ?? []) {
      const next = new Set([...(fields.get(edge.target) ?? []), ...known]);
      fields.set(edge.target, next);
      degrees.set(edge.target, (degrees.get(edge.target) ?? 0) - 1);
      if (degrees.get(edge.target) === 0) ready.push(edge.target);
    }
  }
  if (count < workflow.nodes.length)
    add('cycle', 'Cycles are unsupported. Remove the circular connection.');
  if (!workflow.nodes.some((n) => n.kind === 'end'))
    add('end', 'Add an End node to complete the workflow.');
  return errors;
}

type NodeResult = {
  output: Payload;
  durationMs: number;
  logs: string[];
  branch?: 'true' | 'false';
  attempts?: number;
};
type Executor = (node: WorkflowNode, input: Payload, seed: number) => NodeResult;
export const nodeExecutors: Record<NodeKind, Executor> = {
  trigger: (_n, input) => ({ output: input, durationMs: 0, logs: ['Sample event accepted.'] }),
  condition: (n, input) => {
    const branch = evaluateCondition(input, n.config) ? 'true' : 'false';
    return {
      output: input,
      durationMs: 1,
      branch,
      logs: [`${n.config.field} ${n.config.operator} → ${branch}`],
    };
  },
  transform: (n, input) => {
    const output = structuredClone(input);
    for (const [field, value] of Object.entries(n.config.assignments ?? {})) {
      if (!validPath(field) || field.includes('.')) throw Error(`Unsafe destination: ${field}`);
      if (typeof value === 'string' && value.startsWith('$.')) {
        const resolved = readPath(input, value.slice(2));
        if (resolved === undefined) throw Error(`Missing input field: ${value.slice(2)}`);
        output[field] = structuredClone(resolved);
      } else output[field] = structuredClone(value);
    }
    return {
      output,
      durationMs: 3,
      logs: [`Mapped ${Object.keys(n.config.assignments ?? {}).length} fields.`],
    };
  },
  delay: (n, input) => ({
    output: input,
    durationMs: n.config.durationMs ?? 0,
    logs: ['Simulated clock advanced; no real waiting.'],
  }),
  notification: (n, input) => ({
    output: {
      ...input,
      notifications: [
        ...(Array.isArray(input.notifications) ? input.notifications : []),
        { channel: n.config.channel ?? '', message: n.config.message ?? '', simulated: true },
      ],
    },
    durationMs: 12,
    logs: [`Simulated notification recorded for ${n.config.channel}. No message sent.`],
  }),
  http: (n, input, seed) => {
    const retries = n.config.retries ?? 0;
    const fixture = n.config.fixture;
    if (fixture === 'unavailable' || (fixture === 'retry-success' && retries === 0))
      throw Error('Mock HTTP 503: service unavailable. Choose success or enable a retry.');
    const attempts = fixture === 'retry-success' ? 2 : 1;
    return {
      output: {
        ...input,
        httpResponse: {
          status: 200,
          fixture: fixture ?? 'success',
          body: { accepted: true },
          simulated: true,
        },
      },
      attempts,
      durationMs: (80 + (Math.abs(seed) % 41)) * attempts,
      logs:
        attempts > 1
          ? ['Attempt 1: mock HTTP 503.', 'Retry 1: mock HTTP 200.']
          : ['Local fixture returned mock HTTP 200. No network request.'],
    };
  },
  classifier: (n, input) => {
    const text = readPath(input, n.config.field ?? '');
    if (typeof text !== 'string')
      throw Error(`Classification field “${n.config.field}” must be a string.`);
    const match = (n.config.keywords ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .some((k) => text.toLowerCase().includes(k));
    const category = match ? (n.config.category ?? 'urgent') : 'general';
    return {
      output: {
        ...input,
        category,
        classification: { category, method: 'simulated-keyword-rules' },
      },
      durationMs: 45,
      logs: [`Simulated AI: keyword rules assigned “${category}”. No model used.`],
    };
  },
  end: (_n, input) => ({ output: input, durationMs: 0, logs: ['Active path completed.'] }),
};
export interface SimulationOptions {
  seed: number;
  input: Payload;
  simulatedStartTime: string;
  id?: string;
  source?: 'seeded' | 'local';
  signal?: AbortSignal;
}
export class Simulation {
  readonly execution: Execution;
  private current: string | undefined;
  private byId: Map<string, WorkflowNode>;
  private outgoing: Map<string, Workflow['edges']>;
  private offset = 0;
  constructor(
    private workflow: Workflow,
    private options: SimulationOptions,
  ) {
    const issues = validateGraph(workflow);
    if (issues.length) throw Error(issues.map((i) => i.message).join('\n'));
    const input = payloadSchema.parse(options.input);
    if (!Number.isFinite(Date.parse(options.simulatedStartTime)))
      throw Error('Choose a valid simulated start time.');
    this.byId = new Map(workflow.nodes.map((n) => [n.id, n]));
    this.outgoing = new Map();
    workflow.edges.forEach((e) =>
      this.outgoing.set(e.source, [...(this.outgoing.get(e.source) ?? []), e]),
    );
    this.current = workflow.nodes.find((n) => n.kind === 'trigger')!.id;
    this.execution = {
      id:
        options.id ??
        `run-${hash(JSON.stringify([workflow, input, options.seed, options.simulatedStartTime]))}`,
      workflowId: workflow.id,
      workflowName: workflow.name,
      source: options.source ?? 'local',
      status: 'pending',
      input: structuredClone(input),
      output: structuredClone(input),
      startedAt: options.simulatedStartTime,
      durationMs: 0,
      seed: options.seed,
      traces: [],
      snapshot: structuredClone(workflow),
    };
  }
  cancel() {
    if (this.execution.status === 'pending' || this.execution.status === 'running') {
      this.execution.status = 'cancelled';
      this.current = undefined;
    }
  }
  step(): ExecutionTrace | undefined {
    if (this.options.signal?.aborted) {
      this.cancel();
      return;
    }
    if (!this.current || !['pending', 'running'].includes(this.execution.status)) return;
    this.execution.status = 'running';
    const node = this.byId.get(this.current)!;
    const input = structuredClone(this.execution.output);
    const startedAt = this.time();
    let trace: ExecutionTrace;
    try {
      const r = nodeExecutors[node.kind](node, input, this.options.seed);
      this.offset += r.durationMs;
      trace = {
        nodeId: node.id,
        nodeName: node.name,
        kind: node.kind,
        status: 'completed',
        input,
        output: structuredClone(r.output),
        startedAt,
        completedAt: this.time(),
        durationMs: r.durationMs,
        attempts: r.attempts ?? 1,
        branch: r.branch,
        logs: r.logs,
      };
      this.execution.output = structuredClone(r.output);
      const edge = (this.outgoing.get(node.id) ?? []).find(
        (e) => node.kind !== 'condition' || e.branch === r.branch,
      );
      this.current = edge?.target;
      if (node.kind === 'end' || !this.current) this.execution.status = 'completed';
    } catch (error) {
      const attempts = (node.config.retries ?? 0) + 1;
      const durationMs = node.kind === 'http' ? 100 * attempts : 0;
      this.offset += durationMs;
      const message = error instanceof Error ? error.message : 'Node execution failed.';
      trace = {
        nodeId: node.id,
        nodeName: node.name,
        kind: node.kind,
        status: 'failed',
        input,
        startedAt,
        completedAt: this.time(),
        durationMs,
        attempts,
        error: message,
        logs: [message],
      };
      this.execution.status = 'failed';
      this.execution.error = message;
      this.current = undefined;
    }
    this.execution.traces.push(trace);
    this.execution.durationMs = this.offset;
    if (this.execution.status !== 'running') this.addSkipped();
    return trace;
  }
  private time() {
    return new Date(Date.parse(this.options.simulatedStartTime) + this.offset).toISOString();
  }
  private addSkipped() {
    const seen = new Set(this.execution.traces.map((t) => t.nodeId));
    for (const n of this.workflow.nodes)
      if (!seen.has(n.id))
        this.execution.traces.push({
          nodeId: n.id,
          nodeName: n.name,
          kind: n.kind,
          status: 'skipped',
          input: {},
          startedAt: this.time(),
          completedAt: this.time(),
          durationMs: 0,
          attempts: 1,
          logs: ['Not reached on the selected path.'],
        });
  }
}
export function hash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
export function simulate(workflow: Workflow, options: SimulationOptions): Execution {
  const machine = new Simulation(workflow, options);
  while (['pending', 'running'].includes(machine.execution.status)) machine.step();
  return structuredClone(machine.execution);
}
export async function simulateAsync(
  workflow: Workflow,
  options: SimulationOptions,
): Promise<Execution> {
  const machine = new Simulation(workflow, options);
  while (['pending', 'running'].includes(machine.execution.status)) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    machine.step();
  }
  return structuredClone(machine.execution);
}
export function defaultConfig(kind: NodeKind): NodeConfig {
  switch (kind) {
    case 'condition':
      return { field: 'customerTier', operator: 'equals', value: 'enterprise' };
    case 'transform':
      return { assignments: { priority: 'high' } };
    case 'delay':
      return { durationMs: 1000 };
    case 'notification':
      return { channel: 'support-team', message: 'A new event needs review.' };
    case 'http':
      return { fixture: 'success', retries: 1 };
    case 'classifier':
      return { field: 'message', keywords: 'urgent,outage,critical', category: 'urgent' };
    default:
      return {};
  }
}
export interface CopilotAdapter {
  respond(
    prompt: string,
    workflow?: Workflow,
    execution?: Execution,
  ): { text: string; template?: string };
}
export const mockCopilot: CopilotAdapter = {
  respond(prompt, workflow, execution) {
    const p = prompt.toLowerCase();
    if (/create|generate/.test(p)) {
      const template = /order|risk/.test(p)
        ? 'order-risk'
        : /onboard/.test(p)
          ? 'employee-onboarding'
          : /incident/.test(p)
            ? 'incident-escalation'
            : /document|approval/.test(p)
              ? 'document-approval'
              : /support|triage/.test(p)
                ? 'support-triage'
                : undefined;
      return template
        ? {
            text: 'I selected a deterministic sample template. Review its graph and input before running it.',
            template,
          }
        : {
            text: 'Choose support triage, order risk, employee onboarding, incident escalation, or document approval. This demo uses templates, not a language model.',
          };
    }
    if (/fail|debug/.test(p)) {
      const failed = execution?.traces.find((t) => t.status === 'failed');
      return {
        text: failed
          ? `“${failed.nodeName}” failed: ${failed.error} Inspect its input and configuration, then replay with the success fixture. ${execution?.traces.filter((t) => t.status === 'completed').length} steps completed before this failure.`
          : 'No failed step is available in the selected workflow’s latest execution. Run the failure scenario to explore error inspection.',
      };
    }
    if (/improv|valid/.test(p) && workflow) {
      const issues = validateGraph(workflow);
      return {
        text: issues.length
          ? issues.map((i) => i.message).join('\n')
          : 'The graph is valid. Exercise both condition paths, try the unavailable HTTP fixture, and compare the resulting traces. Simulated notifications never leave this browser.',
      };
    }
    if (/explain/.test(p) && workflow) {
      return {
        text: `${workflow.name} has ${workflow.nodes.length} nodes and ${workflow.edges.length} connections. It starts at “${workflow.nodes.find((n) => n.kind === 'trigger')?.name}”. ${workflow.nodes
          .filter((n) => n.kind === 'condition')
          .map(
            (n) =>
              `“${n.name}” routes when ${n.config.field} ${n.config.operator} ${JSON.stringify(n.config.value)}.`,
          )
          .join(
            ' ',
          )} Only one branch executes at each condition; other nodes are marked skipped. All data and effects stay local.`,
      };
    }
    return {
      text: 'Simulation mode supports: create a named sample workflow, explain this workflow, suggest improvements, and explain the last failure. Arbitrary requests are not supported; no AI model is connected.',
    };
  },
};
