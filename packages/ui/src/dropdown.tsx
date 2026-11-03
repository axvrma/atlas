import type { ReactNode } from 'react';
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import { IconButton } from './primitives';

export function DropdownMenu({
  label,
  trigger,
  items,
}: {
  label: string;
  trigger?: ReactNode;
  items: { label: string; onSelect: () => void; icon?: ReactNode; disabled?: boolean }[];
}) {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger asChild>
        {trigger ?? <IconButton label={label}>•••</IconButton>}
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          className="menu-content"
          sideOffset={5}
          align="end"
          aria-label={label}
        >
          {items.map((item) => (
            <MenuPrimitive.Item
              className="menu-item"
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
            >
              {item.icon}
              {item.label}
            </MenuPrimitive.Item>
          ))}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
