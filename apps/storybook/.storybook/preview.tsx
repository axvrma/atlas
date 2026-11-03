import type { Preview } from '@storybook/react-vite';
import '@atlas/tokens/styles.css';
const preview: Preview = {
  initialGlobals: { theme: 'light' },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'error' },
  },
  decorators: [
    (Story, context) => (
      <div
        data-theme={context.globals.theme}
        style={{
          background: 'var(--bg)',
          color: 'var(--text)',
          padding: 28,
          minHeight: 250,
          borderRadius: 10,
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default preview;
