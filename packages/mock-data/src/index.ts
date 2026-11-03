import {
  type Workflow,
  type WorkflowNode,
  type WorkflowEdge,
  type Workspace,
  type Payload,
} from '@atlas/contracts';
import { defaultConfig, simulate } from '@atlas/core';

const initialDate = '2026-10-26T09:00:00.000Z';
function node(
  id: string,
  kind: WorkflowNode['kind'],
  name: string,
  x: number,
  y: number,
  config = defaultConfig(kind),
): WorkflowNode {
  return { id, kind, name, description: descriptions[kind], position: { x, y }, config };
}
const descriptions: Record<WorkflowNode['kind'], string> = {
  trigger: 'Accept a browser-local sample event.',
  classifier: 'Apply deterministic keyword rules. This is simulated AI.',
  condition: 'Evaluate a structured rule and follow one matching branch.',
  transform: 'Copy the payload and assign configured fields.',
  http: 'Read a local response fixture. No network request is made.',
  notification: 'Append a simulated notification to the execution payload.',
  delay: 'Advance simulated time without waiting.',
  end: 'Complete the active execution path.',
};
const edge = (source: string, target: string, branch?: 'true' | 'false'): WorkflowEdge => ({
  id: `${source}-${target}-${branch ?? 'next'}`,
  source,
  target,
  branch,
});
function make(
  id: string,
  name: string,
  description: string,
  category: string,
  sampleInput: Payload,
  rule: { field: string; value: string | number; operator?: 'equals' | 'greaterThan' },
  names: { trigger: string; condition: string; high: string; low: string },
): Workflow {
  return {
    id,
    name,
    description,
    category,
    status: 'ready',
    createdAt: initialDate,
    updatedAt: initialDate,
    sampleInput,
    nodes: [
      node('trigger', 'trigger', names.trigger, 0, 160),
      node('classify', 'classifier', 'Classify request', 270, 160, {
        field: 'message',
        keywords: 'urgent,outage,critical,blocked',
        category: 'urgent',
      }),
      node('condition', 'condition', names.condition, 540, 160, {
        field: rule.field,
        operator: rule.operator ?? 'equals',
        value: rule.value,
      }),
      node('priority', 'transform', names.high, 810, 40, {
        assignments: { priority: 'high', assignedTeam: 'specialist-team' },
      }),
      node('standard', 'transform', names.low, 810, 300, {
        assignments: { priority: 'normal', assignedTeam: 'operations' },
      }),
      node('http', 'http', 'Enrich event', 1080, 40, { fixture: 'success', retries: 1 }),
      node('notify', 'notification', 'Notify assigned team', 1350, 40, {
        channel: 'specialist-team',
        message: 'A priority event is ready for review.',
      }),
      node('end', 'end', 'Complete', 1620, 160),
    ],
    edges: [
      edge('trigger', 'classify'),
      edge('classify', 'condition'),
      edge('condition', 'priority', 'true'),
      edge('condition', 'standard', 'false'),
      edge('priority', 'http'),
      edge('http', 'notify'),
      edge('notify', 'end'),
      edge('standard', 'end'),
    ],
  };
}
export function seedWorkflows(): Workflow[] {
  return [
    make(
      'support-triage',
      'Customer Support Triage',
      'Route incoming tickets to the right team, with a little less manual work.',
      'Support',
      {
        ticketId: 'TKT-2048',
        customerTier: 'enterprise',
        message: 'Our checkout is blocked. This is urgent.',
        urgency: 'high',
      },
      { field: 'customerTier', value: 'enterprise' },
      {
        trigger: 'New support ticket',
        condition: 'Enterprise customer?',
        high: 'Set priority · high',
        low: 'Standard support queue',
      },
    ),
    make(
      'order-risk',
      'Order Risk Assessment',
      'Assess order value and route high-risk purchases for a closer look.',
      'Commerce',
      {
        orderId: 'ORD-1082',
        amount: 2400,
        currency: 'USD',
        message: 'High-value order requires review.',
      },
      { field: 'amount', value: 1000, operator: 'greaterThan' },
      {
        trigger: 'Order received',
        condition: 'Value above $1,000?',
        high: 'Flag for review',
        low: 'Approve standard order',
      },
    ),
    make(
      'employee-onboarding',
      'Employee Onboarding',
      'Prepare a thoughtful, consistent first day for every new teammate.',
      'People',
      {
        employeeId: 'EMP-042',
        department: 'engineering',
        startDate: '2026-11-09',
        message: 'New engineer joins the platform team.',
      },
      { field: 'department', value: 'engineering' },
      {
        trigger: 'New teammate added',
        condition: 'Engineering team?',
        high: 'Provision dev tools',
        low: 'Prepare welcome kit',
      },
    ),
    make(
      'incident-escalation',
      'Incident Escalation',
      'Turn service alerts into clear ownership and actionable next steps.',
      'Operations',
      {
        incidentId: 'INC-031',
        severity: 'critical',
        service: 'checkout-api',
        message: 'Critical outage affecting checkout.',
      },
      { field: 'severity', value: 'critical' },
      {
        trigger: 'Service alert',
        condition: 'Critical severity?',
        high: 'Page incident lead',
        low: 'Queue for investigation',
      },
    ),
    make(
      'document-approval',
      'Document Approval Pipeline',
      'Keep reviews moving, from a first draft to the final sign-off.',
      'Operations',
      {
        documentId: 'DOC-084',
        documentType: 'contract',
        owner: 'Alex Morgan',
        message: 'Supplier contract ready for legal review.',
      },
      { field: 'documentType', value: 'contract' },
      {
        trigger: 'Document submitted',
        condition: 'Legal review needed?',
        high: 'Assign legal reviewer',
        low: 'Assign team reviewer',
      },
    ),
  ];
}
export function createBlankWorkflow(id: string, name = 'Untitled workflow'): Workflow {
  return {
    id,
    name,
    description: 'A new idea, ready to connect.',
    category: 'General',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sampleInput: { message: 'Hello from Atlas', customerTier: 'enterprise' },
    nodes: [
      node('trigger', 'trigger', 'Sample event', 80, 160),
      node('end', 'end', 'Complete', 430, 160),
    ],
    edges: [edge('trigger', 'end')],
  };
}
export function seedWorkspace(): Workspace {
  const workflows = seedWorkflows();
  const executions = [];
  for (let i = 0; i < 25; i++) {
    const original = workflows[i % workflows.length]!;
    const workflow = structuredClone(original);
    if (i % 7 === 0) workflow.nodes.find((n) => n.kind === 'http')!.config.fixture = 'unavailable';
    const started = new Date(Date.parse(initialDate) + i * 7 * 3600000).toISOString();
    executions.push(
      simulate(workflow, {
        seed: 42,
        input: workflow.sampleInput,
        simulatedStartTime: started,
        id: `seed-${String(i + 1).padStart(4, '0')}`,
        source: 'seeded',
      }),
    );
  }
  return {
    version: 2,
    workflows,
    executions: executions.reverse(),
    preferences: { theme: 'system', onboarding: false, snap: true, minimap: true },
  };
}
