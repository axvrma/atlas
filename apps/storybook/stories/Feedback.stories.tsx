import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Alert,
  AlertDialog,
  Button,
  Dialog,
  Drawer,
  EmptyState,
  Popover,
  Progress,
  Skeleton,
  Spinner,
  Tooltip,
} from '@atlas/ui';
const meta = {
  title: 'Feedback/States and overlays',
  component: Alert,
  args: { children: 'A helpful message' },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>;
export default meta;
export const States: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'grid', gap: 18 }}>
      <Alert>Everything stays in this browser.</Alert>
      <Alert tone="error">Connect a false branch before running this workflow.</Alert>
      <Progress value={65} label="Execution progress" />
      <Skeleton style={{ width: 220, height: 32 }} />
      <Spinner />
      <EmptyState
        title="A new beginning"
        description="Create a workflow to start exploring."
        action={<Button>Create workflow</Button>}
      />
    </div>
  ),
};
function OverlaysExample() {
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button onClick={() => setDialog(true)}>Open dialog</Button>
      <Button onClick={() => setDrawer(true)}>Open drawer</Button>
      <Button onClick={() => setConfirm(true)}>Confirm deletion</Button>
      <Popover trigger={<Button>Popover</Button>}>
        <p style={{ padding: 12 }}>A little contextual help.</p>
      </Popover>
      <Tooltip content="Escape dismisses overlays">
        <Button>Tooltip</Button>
      </Tooltip>
      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        title="Simulation complete"
        description="All steps on the selected path completed."
      >
        <Button onClick={() => setDialog(false)}>Continue</Button>
      </Dialog>
      <Drawer
        open={drawer}
        onOpenChange={setDrawer}
        title="Workflow details"
        description="A keyboard-accessible side panel."
      >
        <p>Press Escape to return focus to the trigger.</p>
      </Drawer>
      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete workflow?"
        description="This example closes the confirmation dialog."
        onConfirm={() => setConfirm(false)}
      />
    </div>
  );
}
export const Overlays: StoryObj<typeof meta> = { render: () => <OverlaysExample /> };
