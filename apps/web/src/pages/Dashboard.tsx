import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheck,
  Clock3,
  GitBranch,
  Play,
  Plus,
  Workflow,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DataTable,
  MetricCard,
  NodeIcon,
  StatusIndicator,
  Surface,
} from '@atlas/ui';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { dateLabel, summarize } from '../features/analytics';
import { VolumeChart } from '../components/VolumeChart';
export default function Dashboard() {
  const { data, run, notify } = useWorkspace();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const stats = summarize(data.executions);
  const sample = data.workflows.find((w) => w.id === 'support-triage') ?? data.workflows[0];
  const recent = [...data.workflows]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE, AT A GLANCE</div>
          <h1>
            Good things start with a workflow<span className="heading-dot">.</span>
          </h1>
          <p>Welcome back, Alex. Let’s turn your next idea into something that works.</p>
        </div>
        <Link className="button button-primary" to="/app/workflows/new">
          <Plus size={15} />
          Create workflow
        </Link>
      </div>
      <div className="welcome-banner">
        <div className="banner-symbol">
          <Workflow size={28} strokeWidth={1.4} />
          <span className="banner-spark">✧</span>
        </div>
        <div>
          <Badge tone="purple">A SPACE TO EXPERIMENT</Badge>
          <h2>Build with confidence. Break things safely.</h2>
          <p>Design a workflow, run a simulation, and see exactly what happens.</p>
        </div>
        <Button onClick={() => sample && navigate(`/app/workflows/${sample.id}`)}>
          Explore a sample
          <ArrowRight size={14} />
        </Button>
        <div className="banner-decoration" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="metrics-grid">
        <MetricCard
          label="Total workflows"
          value={data.workflows.length}
          note={`${data.workflows.filter((w) => w.status === 'ready').length} ready to simulate`}
          icon={<Workflow size={15} />}
        />
        <MetricCard
          label="Simulated executions"
          value={stats.total}
          note={`${data.executions.filter((e) => e.source === 'local').length} from your local experiments`}
          icon={<Activity size={15} />}
        />
        <MetricCard
          label="Success rate"
          value={`${stats.rate}%`}
          note={`${stats.completed} successful · ${stats.failed} failed`}
          icon={<CircleCheck size={15} />}
        />
        <MetricCard
          label="Avg. execution time"
          value={
            <>
              {stats.latency}
              <small> ms</small>
            </>
          }
          note="Simulated latency · no real requests"
          icon={<Clock3 size={15} />}
        />
      </div>
      <div className="dashboard-middle">
        <Card className="volume-card">
          <div className="section-heading">
            <div>
              <h3>Execution overview</h3>
              <p>Your experiments, one run at a time.</p>
            </div>
            <Badge>Last 7 recorded days</Badge>
          </div>
          <div className="chart-legend">
            <span>
              <i style={{ background: 'var(--brand)' }} />
              Successful
            </span>
            <span>
              <i style={{ background: 'var(--red)' }} />
              Failed
            </span>
          </div>
          <VolumeChart executions={data.executions} />
        </Card>
        <Card className="quick-actions">
          <div className="section-heading">
            <div>
              <h3>A good place to start</h3>
              <p>Small steps. Working ideas.</p>
            </div>
          </div>
          <button onClick={() => navigate('/app/workflows/new')}>
            <span className="quick-icon purple">
              <Plus size={18} />
            </span>
            <span>
              <strong>Create a workflow</strong>
              <small>Start with a blank canvas</small>
            </span>
            <ArrowUpRight size={14} />
          </button>
          <button
            disabled={!sample || running}
            onClick={async () => {
              if (!sample) return;
              setRunning(true);
              try {
                const execution = await run(sample);
                navigate(`/app/executions/${execution.id}`);
              } catch (error) {
                notify(
                  error instanceof Error
                    ? error.message
                    : 'The sample could not run. Open the editor to check its graph.',
                );
              } finally {
                setRunning(false);
              }
            }}
          >
            <span className="quick-icon green">
              <Play size={17} />
            </span>
            <span>
              <strong>{running ? 'Running simulation…' : 'Run a sample simulation'}</strong>
              <small>See a workflow in action</small>
            </span>
            <ArrowUpRight size={14} />
          </button>
          <button onClick={() => navigate('/app/executions')}>
            <span className="quick-icon blue">
              <Activity size={18} />
            </span>
            <span>
              <strong>Inspect executions</strong>
              <small>Follow the data, step by step</small>
            </span>
            <ArrowUpRight size={14} />
          </button>
          <Link to="/app/analytics" className="quick-analytics">
            Explore workspace analytics <ArrowRight size={12} />
          </Link>
        </Card>
      </div>
      <section className="recent-workflows">
        <div className="section-heading">
          <div>
            <h3>Pick up where you left off</h3>
            <p>Your recently edited workflows.</p>
          </div>
          <Link className="text-link" to="/app/workflows">
            All workflows
            <ArrowRight size={13} />
          </Link>
        </div>
        <div className="workflow-grid">
          {recent.map((w) => (
            <Link to={`/app/workflows/${w.id}`} key={w.id} className="workflow-card">
              <div className="row spread">
                <NodeIcon
                  kind={
                    w.id.includes('order')
                      ? 'condition'
                      : w.id.includes('employee')
                        ? 'notification'
                        : 'trigger'
                  }
                />
                <StatusIndicator status={w.status} />
              </div>
              <h3>{w.name}</h3>
              <p>{w.description}</p>
              <div className="mini-workflow" aria-hidden="true">
                <span>
                  <GitBranch size={13} />
                </span>
                <i />
                <span>
                  <Activity size={13} />
                </span>
                <i />
                <span>
                  <Check size={13} />
                </span>
              </div>
              <div className="workflow-card-footer">
                <span>
                  {w.nodes.length} nodes <span>·</span> {w.category}
                </span>
                <ArrowUpRight size={13} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <Surface className="recent-executions">
        <div className="section-heading">
          <div>
            <h3>Recent activity</h3>
            <p>A trail of ideas put to the test.</p>
          </div>
          <Link className="text-link" to="/app/executions">
            View all executions
            <ArrowRight size={13} />
          </Link>
        </div>
        <DataTable
          caption="Recent execution activity"
          rows={data.executions.slice(0, 4)}
          rowKey={(e) => e.id}
          columns={[
            {
              label: 'WORKFLOW',
              render: (e) => (
                <Link to={`/app/executions/${e.id}`} className="table-workflow">
                  <span className={`execution-icon ${e.status === 'failed' ? 'error' : ''}`}>
                    {e.status === 'failed' ? <X size={12} /> : <ArrowDownLeft size={13} />}
                  </span>
                  {e.workflowName}
                </Link>
              ),
            },
            { label: 'STATUS', render: (e) => <StatusIndicator status={e.status} /> },
            {
              label: 'DURATION',
              render: (e) => <span className="mono muted">{e.durationMs} ms</span>,
            },
            {
              label: 'STARTED',
              render: (e) => <span className="muted">{dateLabel(e.startedAt)}</span>,
            },
            {
              label: 'SOURCE',
              render: (e) => <Badge>{e.source === 'seeded' ? 'Sample' : 'Local'}</Badge>,
            },
          ]}
        />
      </Surface>
      <div className="dashboard-note">
        <span>
          <span className="live-dot" /> Your workspace is saved in this browser. Sample activity is
          labeled.
        </span>
        <Link to="/app/settings">
          Manage demo data <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
