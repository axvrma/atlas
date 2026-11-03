import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography, Badge } from '@atlas/ui';
const meta = {
  title: 'Foundations/Visual language',
  component: Typography,
  args: { children: 'Atlas Studio' },
  tags: ['autodocs'],
} satisfies Meta<typeof Typography>;
export default meta;
export const TypographyScale: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'grid', gap: 18 }}>
      <Typography as="h1">Clarity for complex workflows.</Typography>
      <Typography as="h2">Design. Simulate. Inspect.</Typography>
      <Typography as="h3">The details make the difference.</Typography>
      <Typography>
        A reusable visual language with platform typography and semantic tokens.
      </Typography>
      <code>execution.status = 'completed'</code>
    </div>
  ),
};
export const SemanticColors: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      {['brand', 'green', 'red', 'amber', 'blue', 'purple', 'slate'].map((c) => (
        <div key={c}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              background: `var(--${c})`,
              marginBottom: 9,
            }}
          />
          <Badge>{c}</Badge>
        </div>
      ))}
    </div>
  ),
};
