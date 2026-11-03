import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Slider,
  RadioGroup,
} from '@atlas/ui';
const meta = {
  title: 'Forms/Field compositions',
  component: FormField,
  args: { label: 'Field', children: null },
  tags: ['autodocs'],
} satisfies Meta<typeof FormField>;
export default meta;
export const WorkflowForm: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <FormField label="Workflow name" hint="A name that describes the process.">
        <Input defaultValue="Customer Support Triage" />
      </FormField>
      <FormField label="Description">
        <Textarea defaultValue="Route new support requests to the right team." />
      </FormField>
      <FormField label="Response fixture">
        <Select>
          <option>200 · Success</option>
          <option>503 · Unavailable</option>
        </Select>
      </FormField>
      <FormField label="Invalid field" error="Choose a field in the input payload.">
        <Input aria-invalid defaultValue="missing.field" />
      </FormField>
      <Checkbox label="Save input as a sample" defaultChecked />
      <Switch label="Snap to grid" defaultChecked />
      <Slider label="Playback speed" min={1} max={4} defaultValue={1} />
    </div>
  ),
};
function RadioExample() {
  const [value, setValue] = useState('local');
  return (
    <RadioGroup
      label="Execution records"
      value={value}
      onChange={setValue}
      options={[
        { value: 'local', label: 'My local runs' },
        { value: 'seeded', label: 'Seeded samples' },
      ]}
    />
  );
}
export const NativeRadioGroup: StoryObj<typeof meta> = { render: () => <RadioExample /> };
