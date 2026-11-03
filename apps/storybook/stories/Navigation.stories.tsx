import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs, Button, CommandMenu, DropdownMenu, Pagination, Tabs } from '@atlas/ui';
const meta = {
  title: 'Navigation/Workspace patterns',
  component: Tabs,
  args: { items: [], value: 'input', onChange: () => {} },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;
export default meta;
function Example() {
  const [tab, setTab] = useState('output');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 25 }}>
      <Breadcrumbs>
        {[
          <a href="#overview" key="workspace">
            Workspace
          </a>,
          <span key="workflow">Customer support</span>,
        ]}
      </Breadcrumbs>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'input', label: 'Input' },
          { value: 'output', label: 'Output' },
          { value: 'logs', label: 'Logs' },
        ]}
      />
      <p>Selected view: {tab}</p>
      <Pagination page={page} onChange={setPage} total={42} />
      <DropdownMenu
        label="Example actions"
        items={[{ label: 'Open command menu', onSelect: () => setOpen(true) }]}
      />
      <Button onClick={() => setOpen(true)}>Open command menu</Button>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        items={[
          { label: 'Open input tab', onSelect: () => setTab('input') },
          { label: 'Open output tab', onSelect: () => setTab('output') },
        ]}
      />
    </div>
  );
}
export const Navigation: StoryObj<typeof meta> = { render: () => <Example /> };
