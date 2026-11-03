import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, IconButton, Tooltip } from '@atlas/ui';
import { Play, Plus } from 'lucide-react';
import { expect, userEvent, within, fn } from 'storybook/test';
const meta = {
  title: 'Actions/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Run simulation', variant: 'primary', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
  },
} satisfies Meta<typeof Button>;
export default meta;
export const Primary: StoryObj<typeof meta> = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
export const AllStates: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <Button variant="primary">
        <Play size={14} />
        Run
      </Button>
      <Button>Save changes</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="danger">Delete workflow</Button>
      <Button disabled>Unavailable</Button>
      <Button loading>Saving</Button>
      <Tooltip content="Add a node">
        <IconButton label="Add a node">
          <Plus size={16} />
        </IconButton>
      </Tooltip>
    </div>
  ),
};
