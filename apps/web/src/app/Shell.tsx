import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChartNoAxesCombined,
  ChevronDown,
  FlaskConical,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  CommandMenu,
  Dialog,
  DropdownMenu,
  IconButton,
  Input,
  Separator,
  SidebarNavigation,
} from '@atlas/ui';
import { mockCopilot } from '@atlas/core';
import { seedWorkflows } from '@atlas/mock-data';
import { Brand } from '../components/Brand';
import { ThemeControl } from '../components/ThemeControl';
import { useWorkspace } from '../providers/WorkspaceProvider';
const links = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard },
  { to: '/app/workflows', label: 'Workflows', icon: Workflow },
  { to: '/app/executions', label: 'Executions', icon: Activity },
  { to: '/app/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
];
export default function Shell() {
  const { data, setPreferences, run, notify } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [command, setCommand] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [tour, setTour] = useState(!data.preferences.onboarding);
  const [step, setStep] = useState(-1);
  const [tourExecution, setTourExecution] = useState('');
  const [busy, setBusy] = useState(false);
  const [copilot, setCopilot] = useState(false);
  useEffect(() => {
    if (!data.preferences.onboarding) {
      setTour(true);
      setStep(-1);
    }
  }, [data.preferences.onboarding]);
  useEffect(() => {
    setMobile(false);
    document.getElementById('main')?.focus();
  }, [location.pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommand((v) => !v);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const closeTour = () => {
    setTour(false);
    setPreferences({ onboarding: true });
    requestAnimationFrame(() => document.getElementById('main')?.focus());
  };
  const tourContent = [
    {
      title: 'Your local workspace',
      body: 'The overview reflects the workflows and execution records stored in this browser. Start by opening your workflow library.',
      action: 'Open workflow library',
      path: '/app/workflows',
    },
    {
      title: 'Five ideas, ready to explore',
      body: 'Each sample has a real graph, editable input, and a failure path. Open Customer Support Triage to explore its nodes.',
      action: 'Open sample editor',
      path: '/app/workflows/support-triage',
    },
    {
      title: 'Design, then simulate',
      body: 'The editor includes a node palette, canvas, inspector, and keyboard-accessible connection list. Let’s execute the sample using its configured event.',
      action: 'Run sample simulation',
      path: '',
    },
    {
      title: 'Inspect the evidence',
      body: 'This debugger shows the run you just created. Select a step, inspect input and output, or use playback to follow the execution.',
      action: 'Open preferences',
      path: '/app/settings',
    },
    {
      title: 'A safe place to experiment',
      body: 'Settings lets you switch themes, export a backup, import validated data, or restore the seeded workspace. You can restart this tour from Help.',
      action: 'Start exploring',
      path: '/app',
    },
  ];
  const title = location.pathname.includes('/workflows/')
    ? 'Workflow editor'
    : (links.find((l) => l.to === location.pathname)?.label ??
      (location.pathname.includes('/executions/') ? 'Execution debugger' : 'Settings'));
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <IconButton
            label="Close navigation"
            className="mobile-only"
            onClick={() => setMobile(false)}
          >
            <X size={17} />
          </IconButton>
        </div>
        <div className="workspace-select">
          <span className="workspace-avatar">A</span>
          <span>
            <strong>Atlas Workspace</strong>
            <small>Personal workspace</small>
          </span>
          <ChevronDown size={12} />
        </div>
        <button className="sidebar-search" onClick={() => setCommand(true)}>
          <Search size={14} />
          <span>Quick search</span>
          <kbd>⌘ K</kbd>
        </button>
        <span className="nav-label">WORKSPACE</span>
        <SidebarNavigation>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              end={to === '/app'}
              to={to}
              key={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} strokeWidth={1.7} />
              <span>{label}</span>
              {label === 'Workflows' && <span className="nav-count">{data.workflows.length}</span>}
            </NavLink>
          ))}
        </SidebarNavigation>
        <div className="sidebar-section">
          <span className="nav-label">RESOURCES</span>
          <Link className="nav-item" to="/engineering">
            <BookOpen size={17} />
            Engineering
            <ArrowUpRight size={12} />
          </Link>
          <a className="nav-item" href="/storybook/">
            <Boxes size={17} />
            Components
            <ArrowUpRight size={12} />
          </a>
          <Link className="nav-item" to="/benchmarks">
            <FlaskConical size={17} />
            Benchmarks
            <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <div className="sandbox-card">
            <span className="sandbox-icon">
              <ShieldCheck size={17} />
            </span>
            <strong>Your ideas. Your sandbox.</strong>
            <p>Explore freely. Everything runs locally in your browser.</p>
            <span>
              <span className="live-dot" /> Demo environment
            </span>
          </div>
          <NavLink className="nav-item" to="/app/settings">
            <Settings size={17} />
            Settings
          </NavLink>
          <DropdownMenu
            label="Help and resources"
            trigger={
              <button className="nav-item help-button">
                <HelpCircle size={17} />
                Help & getting started
                <ChevronDown size={12} />
              </button>
            }
            items={[
              {
                label: 'Restart guided tour',
                onSelect: () => {
                  setStep(-1);
                  setTour(true);
                },
              },
              { label: 'Read engineering notes', onSelect: () => navigate('/engineering') },
              { label: 'Keyboard shortcuts', onSelect: () => setShortcuts(true) },
            ]}
          />
          <div className="profile">
            <Avatar />
            <span>
              <strong>Alex Morgan</strong>
              <small>Atlas Demo Workspace</small>
            </span>
            <Badge>Demo</Badge>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="app-topbar">
          <div className="row">
            <IconButton
              label="Open navigation"
              className="mobile-only"
              onClick={() => setMobile(true)}
            >
              <Menu size={18} />
            </IconButton>
            <span className="topbar-workspace">Workspace</span>
            <span className="topbar-slash">/</span>
            <span>{title}</span>
          </div>
          <div className="row">
            <span className="local-indicator">
              <span className="live-dot" /> All systems local
            </span>
            <Separator />
            <ThemeControl />
            <IconButton label="Search workspace" onClick={() => setCommand(true)}>
              <Search size={16} />
            </IconButton>
            <Avatar />
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className={location.pathname.includes('/workflows/') ? 'main-editor' : 'main-content'}
        >
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            <span className="live-dot" /> Running locally. Built for possibility.
          </span>
          <span>
            Atlas Studio <span className="muted">v1.0</span>
          </span>
        </footer>
      </div>
      <button
        className="copilot-launch"
        onClick={() => setCopilot((v) => !v)}
        aria-expanded={copilot}
      >
        <Sparkles size={16} />
        <span>Ask Atlas</span>
      </button>
      {copilot && <Copilot onClose={() => setCopilot(false)} />}
      <Dialog
        open={shortcuts}
        onOpenChange={setShortcuts}
        title="A few useful shortcuts"
        description="Editor shortcuts leave focused text inputs and selects alone."
      >
        <dl className="shortcut-list">
          {[
            ['⌘ / Ctrl K', 'Search pages and workflows'],
            ['⌘ / Ctrl Z', 'Undo graph edit'],
            ['⇧ ⌘ / Ctrl Z', 'Redo graph edit'],
            ['⌘ / Ctrl S', 'Save workspace'],
            ['⌘ / Ctrl C, V', 'Copy and paste selected nodes'],
            ['⌘ / Ctrl D', 'Duplicate selected nodes'],
            ['Delete / Backspace', 'Remove selected canvas items'],
            ['Escape', 'Clear selection or close overlay'],
          ].map(([key, description]) => (
            <div key={key}>
              <dt>
                <kbd>{key}</kbd>
              </dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <p style={{ fontSize: 11, marginTop: 20 }}>
          Use the accessible node list for node configuration and connections without dragging.
        </p>
      </Dialog>
      <CommandMenu
        open={command}
        onOpenChange={setCommand}
        items={[
          ...links.map((l) => ({ label: l.label, onSelect: () => navigate(l.to) })),
          { label: 'Create workflow', onSelect: () => navigate('/app/workflows/new') },
          ...data.workflows.map((w) => ({
            label: w.name,
            onSelect: () => navigate(`/app/workflows/${w.id}`),
          })),
          { label: 'Settings', onSelect: () => navigate('/app/settings') },
        ]}
      />
      <Dialog
        open={tour}
        onOpenChange={(v) => {
          if (!v) closeTour();
        }}
        title={step < 0 ? 'A little orientation. A lot of possibility.' : tourContent[step]!.title}
        description={
          step < 0
            ? 'Welcome to Atlas Studio, Alex. Build, simulate, and explore in a safe workspace. Everything stays in this browser.'
            : tourContent[step]!.body
        }
      >
        {step < 0 ? (
          <>
            <div className="tour-illustration">
              <Workflow size={32} />
              <span>Design</span>
              <ChevronDown size={16} />
              <Activity size={32} />
              <span>Understand</span>
            </div>
            <div className="dialog-actions">
              <Button onClick={closeTour}>Explore freely</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setStep(0);
                  navigate('/app');
                }}
              >
                Take guided tour
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="tour-progress">
              {tourContent.map((_, i) => (
                <span key={i} className={i <= step ? 'complete' : ''} />
              ))}
              <small>{step + 1} / 5</small>
            </div>
            <div className="dialog-actions">
              <Button onClick={closeTour}>End tour</Button>
              <Button
                variant="primary"
                loading={busy}
                onClick={async () => {
                  const s = tourContent[step]!;
                  if (step === 2) {
                    setBusy(true);
                    try {
                      const e = await run(
                        data.workflows.find((w) => w.id === 'support-triage') ??
                          seedWorkflows()[0]!,
                      );
                      setTourExecution(e.id);
                      navigate(`/app/executions/${e.id}`);
                      setStep(3);
                    } catch (error) {
                      notify(
                        error instanceof Error
                          ? error.message
                          : 'The sample could not run. End the tour to inspect its graph.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  } else if (step === 4) {
                    closeTour();
                    navigate('/app');
                  } else {
                    navigate(
                      s.path || (tourExecution ? `/app/executions/${tourExecution}` : '/app'),
                    );
                    setStep(step + 1);
                  }
                }}
              >
                {tourContent[step]!.action}
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
function Copilot({ onClose }: { onClose: () => void }) {
  const { data, createWorkflow } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.pathname.split('/').at(-1);
  const selectedExecution = location.pathname.startsWith('/app/executions/')
    ? data.executions.find((e) => e.id === id)
    : undefined;
  const workflow =
    selectedExecution?.snapshot ?? data.workflows.find((w) => w.id === id) ?? data.workflows[0];
  const execution = selectedExecution ?? data.executions.find((e) => e.workflowId === workflow?.id);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; template?: string }[]
  >([
    {
      role: 'assistant',
      text: 'I can help you explore this workspace using local templates and graph inspection. Try one of the requests below.',
    },
  ]);
  const send = (text: string) => {
    if (!text.trim()) return;
    const response = mockCopilot.respond(text, workflow, execution);
    setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', ...response }]);
    setPrompt('');
  };
  return (
    <aside className="copilot-panel" aria-label="Atlas Copilot">
      <div className="panel-header">
        <Sparkles size={16} />
        <strong>Atlas Copilot</strong>
        <IconButton label="Close Copilot" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>
      <div className="copilot-disclaimer">
        <Badge tone="purple">Simulation mode</Badge>
        <p>Template-based assistance. No AI model.</p>
      </div>
      <div className="copilot-messages" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`copilot-message ${m.role}`}>
            <span>{m.role === 'assistant' ? 'ATLAS' : 'YOU'}</span>
            <p>{m.text}</p>
            {m.template && (
              <Button
                size="sm"
                onClick={() => {
                  const sample = seedWorkflows().find((w) => w.id === m.template)!;
                  const w = createWorkflow(sample.name, sample);
                  navigate(`/app/workflows/${w.id}`);
                }}
              >
                Create this workflow <Plus size={12} />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="copilot-prompts">
        {[
          'Explain this workflow',
          'Why did the last execution fail?',
          'Suggest improvements',
          'Create a support triage workflow',
        ].map((p) => (
          <button key={p} onClick={() => send(p)}>
            {p}
          </button>
        ))}
      </div>
      <form
        className="copilot-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(prompt);
        }}
      >
        <Input
          aria-label="Copilot request"
          placeholder="Ask about this workflow…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <IconButton label="Send request" type="submit">
          <ArrowUpRight size={17} />
        </IconButton>
      </form>
    </aside>
  );
}
