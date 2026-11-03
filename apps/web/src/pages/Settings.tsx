import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { Alert, AlertDialog, Badge, Button, Card, FormField, Select, Switch } from '@atlas/ui';
import { useWorkspace } from '../providers/WorkspaceProvider';
import { downloadJson, parseImport } from '../services/storage';
export default function Settings() {
  const { data, setPreferences, reset, replace, notify } = useWorkspace();
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState<import('@atlas/contracts').Workspace>();
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE IT YOURS</div>
          <h1>
            Workspace settings<span className="heading-dot">.</span>
          </h1>
          <p>A few preferences for a more comfortable place to build.</p>
        </div>
        <Badge>Isolated demo</Badge>
      </div>
      <div className="settings-layout">
        <Card>
          <h3>Appearance</h3>
          <p className="card-description">A theme for your way of working.</p>
          <FormField label="Color theme">
            <Select
              value={data.preferences.theme}
              onChange={(e) =>
                setPreferences({ theme: e.target.value as 'light' | 'dark' | 'system' })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">Match system</option>
            </Select>
          </FormField>
          <div className="theme-swatches">
            <button aria-label="Use light theme" onClick={() => setPreferences({ theme: 'light' })}>
              <span className="theme-preview light">
                <i />
                <i />
                <i />
              </span>
              Light
            </button>
            <button aria-label="Use dark theme" onClick={() => setPreferences({ theme: 'dark' })}>
              <span className="theme-preview dark">
                <i />
                <i />
                <i />
              </span>
              Dark
            </button>
          </div>
        </Card>
        <Card>
          <h3>Editor preferences</h3>
          <p className="card-description">Small adjustments to keep your canvas comfortable.</p>
          <div className="setting-row">
            <div>
              <strong>Snap to grid</strong>
              <p>Keep node positions aligned to a 20 px grid.</p>
            </div>
            <Switch
              label="Enable snap to grid"
              checked={data.preferences.snap}
              onChange={(e) => setPreferences({ snap: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <div>
              <strong>Canvas minimap</strong>
              <p>Keep the bigger picture in view.</p>
            </div>
            <Switch
              label="Show minimap"
              checked={data.preferences.minimap}
              onChange={(e) => setPreferences({ minimap: e.target.checked })}
            />
          </div>
        </Card>
        <Card>
          <h3>Your workspace data</h3>
          <p className="card-description">
            Stored in this browser, with no account or server. Exports contain your workflow and
            execution snapshots.
          </p>
          <div className="data-summary">
            <span>
              <strong>{data.workflows.length}</strong> workflows
            </span>
            <span>
              <strong>{data.executions.length}</strong> executions
            </span>
            <span>
              Schema <strong>v{data.version}</strong>
            </span>
          </div>
          <div className="row">
            <Button onClick={() => downloadJson(data, 'atlas-workspace.json')}>
              <Download size={14} />
              Export workspace
            </Button>
            <Button onClick={() => file.current?.click()}>
              <Upload size={14} />
              Import workspace
            </Button>
          </div>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              try {
                const selected = e.target.files?.[0];
                if (!selected) return;
                if (selected.size > 5_000_000) throw Error('Keep workspace imports under 5 MB.');
                setPending(parseImport(await selected.text()));
                setError('');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Invalid workspace file.');
              } finally {
                if (file.current) file.current.value = '';
              }
            }}
          />
          {error && <Alert tone="error">Import failed: {error}</Alert>}
        </Card>
        <Card>
          <h3>A fresh start</h3>
          <p className="card-description">
            Restore all five sample workflows and their seeded execution history. Export a backup
            first if you want to keep your experiments.
          </p>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            <RotateCcw size={14} />
            Reset demo workspace
          </Button>
        </Card>
      </div>
      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Start fresh?"
        description="Your local workflows, execution history, and preferences will be replaced with the original sample workspace. This cannot be undone."
        confirmLabel="Reset demo"
        onConfirm={reset}
      />
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(v) => !v && setPending(undefined)}
        title="Replace this workspace?"
        description={`The validated import contains ${pending?.workflows.length} workflows and ${pending?.executions.length} executions. Existing browser data will be replaced.`}
        confirmLabel="Import workspace"
        onConfirm={() => {
          if (pending) {
            replace(pending);
            setPending(undefined);
            notify('Workspace imported and validated.');
          }
        }}
      />
    </>
  );
}
