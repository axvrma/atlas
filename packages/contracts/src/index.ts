import { z } from 'zod';

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type Payload = Record<string, JsonValue>;
export const payloadSchema = z.record(z.string(), z.json());
export const nodeKinds = [
  'trigger',
  'condition',
  'transform',
  'delay',
  'notification',
  'http',
  'classifier',
  'end',
] as const;
export type NodeKind = (typeof nodeKinds)[number];
export const configSchema = z.object({
  field: z.string().max(200).optional(),
  operator: z
    .enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'exists'])
    .optional(),
  value: z.json().optional(),
  assignments: payloadSchema.optional(),
  durationMs: z.number().min(0).max(86400000).optional(),
  channel: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  fixture: z.enum(['success', 'unavailable', 'retry-success']).optional(),
  retries: z.number().int().min(0).max(3).optional(),
  keywords: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
});
export type NodeConfig = z.infer<typeof configSchema>;
export const nodeSchema = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(nodeKinds),
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  config: configSchema,
});
export type WorkflowNode = z.infer<typeof nodeSchema>;
export const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string(),
  target: z.string(),
  branch: z.enum(['true', 'false']).optional(),
});
export type WorkflowEdge = z.infer<typeof edgeSchema>;
export const workflowSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  status: z.enum(['ready', 'draft', 'archived']),
  category: z.string().max(100),
  nodes: z.array(nodeSchema).max(1000),
  edges: z.array(edgeSchema).max(2000),
  sampleInput: payloadSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Workflow = z.infer<typeof workflowSchema>;
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export const traceSchema = z.object({
  nodeId: z.string(),
  nodeName: z.string(),
  kind: z.enum(nodeKinds),
  status: z.enum(['completed', 'failed', 'skipped']),
  input: payloadSchema,
  output: payloadSchema.optional(),
  error: z.string().optional(),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  durationMs: z.number().nonnegative(),
  attempts: z.number().int().positive(),
  branch: z.enum(['true', 'false']).optional(),
  logs: z.array(z.string()),
});
export type ExecutionTrace = z.infer<typeof traceSchema>;
export const executionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  source: z.enum(['seeded', 'local']),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  input: payloadSchema,
  output: payloadSchema,
  startedAt: z.iso.datetime(),
  durationMs: z.number().nonnegative(),
  seed: z.number(),
  traces: z.array(traceSchema),
  error: z.string().optional(),
  snapshot: workflowSchema,
});
export type Execution = z.infer<typeof executionSchema>;
export const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  onboarding: z.boolean(),
  snap: z.boolean(),
  minimap: z.boolean(),
});
export type Preferences = z.infer<typeof preferencesSchema>;
export const workspaceSchema = z.object({
  version: z.literal(2),
  workflows: z.array(workflowSchema).max(200),
  executions: z.array(executionSchema).max(500),
  preferences: preferencesSchema,
});
export type Workspace = z.infer<typeof workspaceSchema>;
export type Diagnostic = { nodeId?: string; code: string; message: string };
export const nodeMeta: Record<
  NodeKind,
  { label: string; description: string; color: string; glyph: string }
> = {
  trigger: {
    label: 'Trigger',
    description: 'Start with a sample event',
    color: 'amber',
    glyph: 'Zap',
  },
  condition: {
    label: 'Condition',
    description: 'Route on a structured rule',
    color: 'purple',
    glyph: 'GitBranch',
  },
  transform: {
    label: 'Transform',
    description: 'Map and enrich payload fields',
    color: 'blue',
    glyph: 'Braces',
  },
  delay: { label: 'Delay', description: 'Advance simulated time', color: 'slate', glyph: 'Clock' },
  notification: {
    label: 'Notification',
    description: 'Record a simulated message',
    color: 'green',
    glyph: 'Bell',
  },
  http: {
    label: 'HTTP request',
    description: 'Resolve a local response fixture',
    color: 'blue',
    glyph: 'Globe',
  },
  classifier: {
    label: 'AI classification',
    description: 'Simulated keyword classification',
    color: 'purple',
    glyph: 'Sparkles',
  },
  end: {
    label: 'End',
    description: 'Complete the active path',
    color: 'green',
    glyph: 'CircleCheck',
  },
};
