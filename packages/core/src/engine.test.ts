import { describe, expect, it } from 'vitest';
import { createBlankWorkflow, seedWorkflows, seedWorkspace } from '@atlas/mock-data';
import {
  defaultConfig,
  evaluateCondition,
  mockCopilot,
  nodeExecutors,
  readPath,
  simulate,
  simulateAsync,
  Simulation,
  validPath,
  validateGraph,
} from './index';
import { nodeKinds, type Workflow } from '@atlas/contracts';
const options = {
  input: seedWorkflows()[0]!.sampleInput,
  seed: 42,
  simulatedStartTime: '2026-10-26T09:00:00.000Z',
};
const sample = () => structuredClone(seedWorkflows()[0]!);
describe('graph validation', () => {
  it('accepts all five seeded graphs and a minimal new graph', () => {
    for (const workflow of [...seedWorkflows(), createBlankWorkflow('new')])
      expect(validateGraph(workflow)).toEqual([]);
  });
  it('rejects missing and multiple triggers', () => {
    const w = sample();
    w.nodes = w.nodes.filter((n) => n.kind !== 'trigger');
    expect(validateGraph(w).some((d) => d.code === 'trigger')).toBe(true);
    const other = sample();
    other.nodes.push({ ...other.nodes[0]!, id: 'another' });
    expect(validateGraph(other).some((d) => d.code === 'trigger')).toBe(true);
  });
  it('rejects missing targets, disconnected nodes and cycles', () => {
    const w = sample();
    w.edges.push({ id: 'bad', source: 'end', target: 'missing' });
    expect(validateGraph(w).some((d) => d.code === 'connection')).toBe(true);
    const disconnected = sample();
    disconnected.edges = [];
    expect(validateGraph(disconnected).some((d) => d.code === 'disconnected')).toBe(true);
    const cycle = sample();
    cycle.edges.push({ id: 'cycle', source: 'end', target: 'classify' });
    expect(validateGraph(cycle).some((d) => d.code === 'cycle')).toBe(true);
  });
  it('requires both condition paths and rejects unsupported fan-out', () => {
    const w = sample();
    w.edges = w.edges.filter((e) => e.branch !== 'false');
    expect(validateGraph(w).some((d) => d.code === 'paths')).toBe(true);
    w.edges.push({ id: 'extra', source: 'trigger', target: 'end' });
    expect(validateGraph(w).some((d) => d.code === 'branch')).toBe(true);
  });
  it('rejects missing config, invalid references and unsafe assignments', () => {
    const w = sample();
    w.nodes.find((n) => n.kind === 'condition')!.config = {
      field: 'unknown',
      operator: 'equals',
      value: 1,
    };
    w.nodes.find((n) => n.kind === 'transform')!.config = {
      assignments: JSON.parse('{"__proto__":"unsafe"}') as Record<string, string>,
    };
    expect(validateGraph(w).some((d) => d.code === 'field')).toBe(true);
    expect(validateGraph(w).some((d) => d.code === 'reference')).toBe(true);
    w.nodes.find((n) => n.kind === 'http')!.config = {};
    expect(validateGraph(w).some((d) => d.code === 'config')).toBe(true);
  });
  it('validates schemas and duplicate IDs', () => {
    const w = sample();
    w.nodes.push(w.nodes[0]!);
    expect(validateGraph(w).some((d) => d.code === 'duplicate-id')).toBe(true);
    expect(validateGraph({ ...w, name: '' }).some((d) => d.code === 'schema')).toBe(true);
  });
});
describe('safe conditions and transformations', () => {
  it.each([
    ['equals', 4, true],
    ['notEquals', 3, true],
    ['greaterThan', 3, true],
    ['lessThan', 5, true],
    ['exists', null, true],
  ] as const)('%s compares structured values', (operator, value, result) => {
    expect(evaluateCondition({ score: 4 }, { field: 'score', operator, value })).toBe(result);
  });
  it('does not coerce types and handles nested paths', () => {
    expect(
      evaluateCondition({ score: '4' }, { field: 'score', operator: 'greaterThan', value: 3 }),
    ).toBe(false);
    expect(
      evaluateCondition(
        { message: 'URGENT request' },
        { field: 'message', operator: 'contains', value: 'urgent' },
      ),
    ).toBe(true);
    expect(readPath({ user: { tier: 'enterprise' } }, 'user.tier')).toBe('enterprise');
    expect(readPath({}, 'constructor.name')).toBeUndefined();
    expect(validPath('__proto__.polluted')).toBe(false);
    expect(validPath('a[0]')).toBe(false);
  });
  it('maps literals and field references without mutating input', () => {
    const w = sample();
    const node = w.nodes.find((n) => n.kind === 'transform')!;
    node.config = { assignments: { copied: '$.message', priority: 'high' } };
    const input = { message: 'A ticket' };
    expect(nodeExecutors.transform(node, input, 42).output).toEqual({
      ...input,
      copied: 'A ticket',
      priority: 'high',
    });
    expect(input).toEqual({ message: 'A ticket' });
    node.config = { assignments: { copied: '$.missing' } };
    expect(() => nodeExecutors.transform(node, input, 42)).toThrow('Missing input field');
  });
});
describe('deterministic simulation', () => {
  it('runs true and false branches with accurate skipped traces', () => {
    const a = simulate(sample(), options);
    expect(a.status).toBe('completed');
    expect(a.output.priority).toBe('high');
    expect(a.traces.find((t) => t.nodeId === 'standard')?.status).toBe('skipped');
    const b = simulate(sample(), {
      ...options,
      input: { ...options.input, customerTier: 'standard' },
    });
    expect(b.output.priority).toBe('normal');
    expect(b.traces.find((t) => t.nodeId === 'http')?.status).toBe('skipped');
  });
  it('produces identical traces and serializes cleanly', () => {
    const w = sample();
    const before = JSON.stringify(w);
    const a = simulate(w, options);
    const b = simulate(w, options);
    expect(a).toEqual(b);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(JSON.stringify(w)).toBe(before);
  });
  it('propagates failure and bounded HTTP retries', () => {
    const w = sample();
    const http = w.nodes.find((n) => n.kind === 'http')!;
    http.config = { fixture: 'unavailable', retries: 2 };
    const failed = simulate(w, options);
    expect(failed.status).toBe('failed');
    expect(failed.traces.find((t) => t.nodeId === http.id)?.attempts).toBe(3);
    expect(failed.traces.find((t) => t.nodeId === 'end')?.status).toBe('skipped');
    http.config = { fixture: 'retry-success', retries: 1 };
    const retried = simulate(w, options);
    expect(retried.status).toBe('completed');
    expect(retried.traces.find((t) => t.nodeId === http.id)?.attempts).toBe(2);
  });
  it('supports every node kind, virtual delays and simulated effects', () => {
    for (const kind of nodeKinds) expect(defaultConfig(kind)).toBeDefined();
    const w = createBlankWorkflow('delay');
    w.nodes.splice(1, 0, {
      id: 'delay',
      kind: 'delay',
      name: 'Pause',
      description: 'Virtual pause',
      position: { x: 200, y: 0 },
      config: { durationMs: 60000 },
    });
    w.edges = [
      { id: 'a', source: 'trigger', target: 'delay' },
      { id: 'b', source: 'delay', target: 'end' },
    ];
    const e = simulate(w, { ...options, input: w.sampleInput });
    expect(e.durationMs).toBe(60000);
    expect(e.traces[1]?.completedAt).toBe('2026-10-26T09:01:00.000Z');
    const ticket = simulate(sample(), options);
    expect(ticket.output.notifications).toBeDefined();
    expect(ticket.output.classification).toEqual({
      category: 'urgent',
      method: 'simulated-keyword-rules',
    });
  });
  it('has independent pending, running, completed, cancelled states', () => {
    const machine = new Simulation(sample(), options);
    expect(machine.execution.status).toBe('pending');
    machine.step();
    expect(machine.execution.status).toBe('running');
    expect(machine.execution.traces[0]?.status).toBe('completed');
    machine.cancel();
    expect(machine.execution.status).toBe('cancelled');
    expect(machine.step()).toBeUndefined();
    const complete = new Simulation(createBlankWorkflow('simple'), options);
    complete.step();
    complete.step();
    expect(complete.execution.status).toBe('completed');
    complete.cancel();
    expect(complete.execution.status).toBe('completed');
  });
  it('honors cancellation before and during async simulation', async () => {
    const controller = new AbortController();
    controller.abort();
    expect((await simulateAsync(sample(), { ...options, signal: controller.signal })).status).toBe(
      'cancelled',
    );
    const active = new AbortController();
    const result = simulateAsync(sample(), { ...options, signal: active.signal });
    active.abort();
    expect((await result).status).toBe('cancelled');
  });
  it('refuses invalid graphs and inputs', () => {
    const invalid = sample();
    invalid.edges = [];
    expect(() => simulate(invalid, options)).toThrow();
    expect(() =>
      simulate(sample(), { ...options, input: [] as unknown as Workflow['sampleInput'] }),
    ).toThrow();
    expect(() => simulate(sample(), { ...options, simulatedStartTime: 'bad' })).toThrow(
      'valid simulated start',
    );
  });
  it('generates coherent seeded records with actual engine snapshots', () => {
    const workspace = seedWorkspace();
    expect(workspace.workflows).toHaveLength(5);
    expect(workspace.executions).toHaveLength(25);
    expect(workspace.executions.some((e) => e.status === 'failed')).toBe(true);
    for (const e of workspace.executions) expect(e.traces).toHaveLength(e.snapshot.nodes.length);
  });
});
describe('template copilot', () => {
  it('introspects graphs and errors without pretending to be an LLM', () => {
    expect(mockCopilot.respond('Create an order risk workflow').template).toBe('order-risk');
    expect(mockCopilot.respond('Explain this workflow', sample()).text).toContain('8 nodes');
    expect(mockCopilot.respond('Suggest improvements', sample()).text).toContain('graph is valid');
    expect(mockCopilot.respond('Write me a poem').text).toContain('not supported');
    const w = sample();
    w.nodes.find((n) => n.kind === 'http')!.config.fixture = 'unavailable';
    expect(mockCopilot.respond('Why did it fail?', w, simulate(w, options)).text).toContain('503');
  });
});
