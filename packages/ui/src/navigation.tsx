import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import { Button, IconButton } from './primitives';
import { Input } from './forms';
import { Dialog } from './dialog';

export function Tabs({
  items,
  value,
  onChange,
  label = 'Views',
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="tabs">
      {items.map((item, i) => (
        <button
          type="button"
          role="tab"
          key={item.value}
          aria-selected={value === item.value}
          tabIndex={value === item.value ? 0 : -1}
          className="tab"
          onClick={() => onChange(item.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              e.preventDefault();
              const target =
                items[(i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length]!;
              onChange(target.value);
              (
                e.currentTarget.parentElement?.children[items.indexOf(target)] as HTMLElement
              )?.focus();
            }
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function Breadcrumbs({ children }: { children: ReactNode[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {children.map((child, i) => (
        <span key={i} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          {i > 0 && <ChevronRight size={11} />} {child}
        </span>
      ))}
    </nav>
  );
}
export function SidebarNavigation({ children }: { children: ReactNode }) {
  return <nav aria-label="Workspace navigation">{children}</nav>;
}
export function TopNavigation({ children }: { children: ReactNode }) {
  return <nav aria-label="Main navigation">{children}</nav>;
}
export function Pagination({
  page,
  total,
  onChange,
  pageSize = 10,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
  pageSize?: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="pagination">
      <span>
        {total === 0
          ? 'No results'
          : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
      </span>
      <span>
        <IconButton label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)}>
          <ArrowLeft size={14} />
        </IconButton>
        <IconButton label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          <ArrowRight size={14} />
        </IconButton>
      </span>
    </div>
  );
}
export function CommandMenu({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: { label: string; onSelect: () => void }[];
}) {
  const [search, setSearch] = useState('');
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Jump to anything"
      description="Find a page or workflow. Use Tab to move through results."
    >
      <Input
        aria-label="Search commands"
        placeholder="Search pages and workflows…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div style={{ display: 'grid', gap: 5, marginTop: 15 }}>
        {items
          .filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
          .map((i) => (
            <Button
              key={i.label}
              variant="ghost"
              onClick={() => {
                i.onSelect();
                onOpenChange(false);
                setSearch('');
              }}
            >
              {i.label}
              <ChevronRight size={14} />
            </Button>
          ))}
      </div>
    </Dialog>
  );
}
