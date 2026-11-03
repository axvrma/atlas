import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Copy,
  Grid2X2,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Workflow,
} from 'lucide-react';
import {
  AlertDialog,
  Badge,
  Button,
  DataTable,
  Dialog,
  DropdownMenu,
  EmptyState,
  FormField,
  IconButton,
  Input,
  Select,
  StatusIndicator,
} from '@atlas/ui';
import type { Workflow as WorkflowModel } from '@atlas/contracts';
import { seedWorkflows } from '@atlas/mock-data';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { dateLabel } from '../features/analytics';
export default function Library() {
  const { data, createWorkflow, deleteWorkflow, updateWorkflow, notify } = useWorkspace();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState('grid');
  const [deleting, setDeleting] = useState<WorkflowModel>();
  const [renaming, setRenaming] = useState<WorkflowModel>();
  const [name, setName] = useState('');
  const workflows = data.workflows
    .filter(
      (w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) &&
        (status === 'all' || w.status === status),
    )
    .sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt),
    );
  const menu = (w: WorkflowModel) => (
    <DropdownMenu
      label={`Actions for ${w.name}`}
      trigger={
        <IconButton label={`Actions for ${w.name}`}>
          <MoreHorizontal size={17} />
        </IconButton>
      }
      items={[
        { label: 'Open editor', onSelect: () => navigate(`/app/workflows/${w.id}`) },
        {
          label: 'Duplicate workflow',
          icon: <Copy size={13} />,
          onSelect: () => {
            const copy = createWorkflow(undefined, w);
            navigate(`/app/workflows/${copy.id}`);
          },
        },
        {
          label: 'Rename workflow',
          icon: <Pencil size={13} />,
          onSelect: () => {
            setRenaming(w);
            setName(w.name);
          },
        },
        {
          label: 'Inspect last execution',
          disabled: !data.executions.some((e) => e.workflowId === w.id),
          onSelect: () =>
            navigate(`/app/executions/${data.executions.find((e) => e.workflowId === w.id)!.id}`),
        },
        { label: 'Delete workflow', icon: <Trash2 size={13} />, onSelect: () => setDeleting(w) },
      ]}
    />
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">CONNECT YOUR IDEAS</div>
          <h1>
            Workflows<span className="heading-dot">.</span>
          </h1>
          <p>A home for the processes you’re building, refining, and reimagining.</p>
        </div>
        <Link className="button button-primary" to="/app/workflows/new">
          <Plus size={15} />
          Create workflow
        </Link>
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={15} />
          <Input
            aria-label="Search workflows"
            placeholder="Search workflows…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="ready">Ready</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <Select aria-label="Sort workflows" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updated">Recently edited</option>
          <option value="name">Name A–Z</option>
        </Select>
        <div className="view-toggle">
          <IconButton
            label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            <Grid2X2 size={15} />
          </IconButton>
          <IconButton
            label="List view"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            <List size={15} />
          </IconButton>
        </div>
      </div>
      <div className="result-count">
        {workflows.length} workflow{workflows.length === 1 ? '' : 's'}{' '}
        <span>· Saved locally in this browser</span>
      </div>
      {!workflows.length ? (
        <EmptyState
          title="A little space for a new idea"
          description="Try another search or create a workflow from a blank canvas."
          action={
            <Link className="button button-primary" to="/app/workflows/new">
              Create workflow
            </Link>
          }
        />
      ) : view === 'grid' ? (
        <div className="workflow-grid library-grid">
          {workflows.map((w) => (
            <article className="workflow-card" key={w.id}>
              <div className="row spread">
                <span
                  className={`quick-icon ${w.category === 'Support' ? 'purple' : w.category === 'Commerce' ? 'blue' : 'green'}`}
                >
                  <Workflow size={20} />
                </span>
                {menu(w)}
              </div>
              <Link to={`/app/workflows/${w.id}`}>
                <h3>{w.name}</h3>
                <p>{w.description}</p>
                <div
                  className="mini-workflow"
                  aria-label={`${w.nodes.length} nodes, ${w.edges.length} connections`}
                >
                  {w.nodes.slice(0, 5).map((n, i) => (
                    <span key={n.id} className={`mini-${n.kind}`}>
                      {i + 1}
                    </span>
                  ))}
                </div>
              </Link>
              <div className="workflow-card-footer">
                <StatusIndicator status={w.status} />
                <span>
                  {w.nodes.length} nodes <span>·</span> {w.category}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface">
          <DataTable
            caption="Workflow library"
            rows={workflows}
            rowKey={(w) => w.id}
            columns={[
              {
                label: 'WORKFLOW',
                render: (w) => (
                  <Link className="table-workflow" to={`/app/workflows/${w.id}`}>
                    <Workflow size={15} />
                    {w.name}
                  </Link>
                ),
              },
              { label: 'STATUS', render: (w) => <StatusIndicator status={w.status} /> },
              { label: 'NODES', render: (w) => w.nodes.length },
              { label: 'UPDATED', render: (w) => dateLabel(w.updatedAt) },
              { label: 'ACTIONS', render: menu },
            ]}
          />
        </div>
      )}
      <section className="library-tip">
        <div>
          <Badge tone="purple">LOCAL FIRST</Badge>
          <h3>Experiments are better without consequences.</h3>
          <p>
            Every notification and HTTP request is simulated. Your workflows stay in this browser.
          </p>
        </div>
        <Link to="/engineering/architecture" className="text-link">
          How it works <ArrowRight size={13} />
        </Link>
      </section>
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(undefined)}
        title="Delete this workflow?"
        description={`“${deleting?.name}” will be removed from your workspace. Existing execution snapshots remain available.`}
        onConfirm={() => {
          if (deleting) deleteWorkflow(deleting.id);
        }}
      />
      <Dialog
        open={Boolean(renaming)}
        onOpenChange={(v) => !v && setRenaming(undefined)}
        title="A name for your workflow"
        description="Make it easy to recognize in your library."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (renaming && name.trim()) {
              updateWorkflow({ ...renaming, name: name.trim() });
              setRenaming(undefined);
              notify('Workflow renamed.');
            }
          }}
        >
          <FormField label="Workflow name">
            <Input
              autoFocus
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <div className="dialog-actions">
            <Button onClick={() => setRenaming(undefined)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!name.trim()}>
              Save name
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
export function NewWorkflow() {
  const { createWorkflow } = useWorkspace();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('blank');
  return (
    <div className="new-workflow">
      <div className="eyebrow">AN IDEA STARTS HERE</div>
      <h1>Create a workflow</h1>
      <p>Choose a starting point. You can change everything on the canvas.</p>
      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          const sample = seedWorkflows().find((w) => w.id === template);
          const workflow = createWorkflow(name.trim() || undefined, sample);
          navigate(`/app/workflows/${workflow.id}`);
        }}
      >
        <FormField label="Workflow name">
          <Input
            autoFocus
            required
            placeholder="e.g. Customer feedback routing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </FormField>
        <FormField label="Start from">
          <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="blank">A blank canvas</option>
            {seedWorkflows().map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="dialog-actions">
          <Link className="button" to="/app/workflows">
            Cancel
          </Link>
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            <Plus size={14} />
            Create workflow
          </Button>
        </div>
      </form>
    </div>
  );
}
