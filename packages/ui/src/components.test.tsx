import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Alert,
  Button,
  Dialog,
  FormField,
  Input,
  NodeInspector,
  StatusIndicator,
  Tabs,
  WorkflowNode,
} from './index';
import type { WorkflowNode as NodeModel } from '@atlas/contracts';
const node: NodeModel = {
  id: 'rule',
  kind: 'condition',
  name: 'Enterprise customer?',
  description: 'Route the ticket',
  position: { x: 0, y: 0 },
  config: { field: 'customerTier', operator: 'equals', value: 'enterprise' },
};
describe('accessible shared components', () => {
  it('runs button actions and honors disabled/loading state', async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const { rerender } = render(<Button onClick={click}>Run simulation</Button>);
    await user.click(screen.getByRole('button'));
    expect(click).toHaveBeenCalledOnce();
    rerender(
      <Button loading onClick={click}>
        Run simulation
      </Button>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading');
  });
  it('labels form inputs and shows actionable errors', async () => {
    const user = userEvent.setup();
    render(
      <FormField label="Workflow name" error="A name is required">
        <Input aria-invalid />
      </FormField>,
    );
    await user.type(screen.getByRole('textbox'), 'A new workflow');
    expect(screen.getByRole('textbox')).toHaveValue('A new workflow');
    expect(screen.getByRole('alert')).toHaveTextContent('A name is required');
  });
  it('traps dialog semantics and handles Escape', async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(
      <Dialog
        open
        onOpenChange={close}
        title="Review workflow"
        description="Inspect before you run."
      >
        <Button>Continue</Button>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Review workflow');
    await user.keyboard('{Escape}');
    expect(close).toHaveBeenCalledWith(false);
  });
  it('supports keyboard tab navigation', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Tabs
        value="input"
        onChange={change}
        items={[
          { value: 'input', label: 'Input' },
          { value: 'output', label: 'Output' },
        ]}
      />,
    );
    screen.getByRole('tab', { name: 'Input' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(change).toHaveBeenCalledWith('output');
  });
  it('updates node configuration using labelled inspector fields', async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<NodeInspector node={node} onChange={change} diagnostics={['Connect a false path.']} />);
    const name = screen.getByLabelText('Node name');
    await user.type(name, '!');
    expect(change).toHaveBeenCalled();
    expect(change.mock.calls.at(-1)?.[0].name).toContain('!');
    expect(screen.getByText('Connect a false path.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Operator'), 'contains');
    expect(change.mock.calls.at(-1)?.[0].config.operator).toBe('contains');
  });
  it('renders color-independent workflow statuses and errors', () => {
    render(
      <>
        <WorkflowNode node={node} status="failed" />
        <StatusIndicator status="failed" />
        <Alert tone="error">Mock service unavailable</Alert>
      </>,
    );
    expect(screen.getByText('Enterprise customer?')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Mock service unavailable');
  });
});
