import { Moon, Sun, Monitor } from 'lucide-react';
import { DropdownMenu, IconButton } from '@atlas/ui';
import { useWorkspace } from '../providers/WorkspaceProvider';
export function ThemeControl() {
  const { data, setPreferences } = useWorkspace();
  return (
    <DropdownMenu
      label="Color theme"
      trigger={
        <IconButton label="Choose color theme">
          {data.preferences.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </IconButton>
      }
      items={[
        {
          label: 'Light theme',
          icon: <Sun size={14} />,
          onSelect: () => setPreferences({ theme: 'light' }),
        },
        {
          label: 'Dark theme',
          icon: <Moon size={14} />,
          onSelect: () => setPreferences({ theme: 'dark' }),
        },
        {
          label: 'System theme',
          icon: <Monitor size={14} />,
          onSelect: () => setPreferences({ theme: 'system' }),
        },
      ]}
    />
  );
}
