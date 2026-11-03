import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { type Execution, type Preferences, type Workflow, type Workspace } from '@atlas/contracts';
import { createBlankWorkflow, seedWorkspace } from '@atlas/mock-data';
import { simulateAsync } from '@atlas/core';
import { cachePreferences, loadWorkspace, persistWorkspace } from '../services/storage';
import { Alert, Spinner, Toast } from '@atlas/ui';

interface WorkspaceContext {
  data: Workspace;
  updateWorkflow: (w: Workflow) => void;
  createWorkflow: (name?: string, template?: Workflow) => Workflow;
  deleteWorkflow: (id: string) => void;
  addExecution: (e: Execution) => void;
  setPreferences: (p: Partial<Preferences>) => void;
  reset: () => void;
  replace: (w: Workspace) => void;
  notify: (s: string) => void;
  run: (w: Workflow, input?: Workflow['sampleInput'], signal?: AbortSignal) => Promise<Execution>;
  saveNow: () => Promise<void>;
}
const Context = createContext<WorkspaceContext | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Workspace | null>(null);
  const [warning, setWarning] = useState('');
  const [toast, setToast] = useState('');
  const saveChain = useRef(Promise.resolve());
  const latest = useRef(data);
  latest.current = data;
  useEffect(() => {
    let active = true;
    loadWorkspace().then((r) => {
      if (active) {
        setData(r.workspace);
        if (r.warning) setWarning(r.warning);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const persist = useCallback((value: Workspace) => {
    const operation = saveChain.current.then(async () => {
      const message = await persistWorkspace(value);
      setWarning(message ?? '');
    });
    saveChain.current = operation;
    return operation;
  }, []);
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      void persist(data);
    }, 200);
    return () => clearTimeout(timer);
  }, [data, persist]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const theme = data?.preferences.theme;
  // Theme listeners follow both persisted preferences and live OS preference changes.
  useEffect(() => {
    if (!theme) return;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      (document.documentElement.dataset.theme =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  const updateWorkflow = useCallback(
    (workflow: Workflow) =>
      setData((d) =>
        d
          ? {
              ...d,
              workflows: d.workflows.map((w) =>
                w.id === workflow.id ? { ...workflow, updatedAt: new Date().toISOString() } : w,
              ),
            }
          : d,
      ),
    [],
  );
  const addExecution = useCallback(
    (execution: Execution) =>
      setData((d) =>
        d
          ? {
              ...d,
              executions: [execution, ...d.executions.filter((e) => e.id !== execution.id)].slice(
                0,
                500,
              ),
            }
          : d,
      ),
    [],
  );
  if (!data)
    return (
      <div className="app-loading">
        <Spinner />
        <span>Preparing your local workspace…</span>
      </div>
    );
  const createWorkflow = (name?: string, template?: Workflow) => {
    const id = crypto.randomUUID();
    const workflow = template
      ? {
          ...structuredClone(template),
          id,
          name: name ?? `${template.name} copy`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : createBlankWorkflow(id, name);
    setData((d) => (d ? { ...d, workflows: [workflow, ...d.workflows] } : d));
    return workflow;
  };
  const value: WorkspaceContext = {
    data,
    updateWorkflow,
    createWorkflow,
    deleteWorkflow: (id) =>
      setData((d) => (d ? { ...d, workflows: d.workflows.filter((w) => w.id !== id) } : d)),
    addExecution,
    setPreferences: (p) => {
      const next = { ...data, preferences: { ...data.preferences, ...p } };
      cachePreferences(next.preferences);
      setData(next);
      void persist(next);
    },
    reset: () => {
      const fresh = seedWorkspace();
      cachePreferences(fresh.preferences);
      setData(fresh);
      setToast('Demo restored. Your browser now has the original sample workspace.');
    },
    replace: (workspace) => {
      cachePreferences(workspace.preferences);
      setData(workspace);
    },
    notify: setToast,
    run: async (w, input = w.sampleInput, signal) => {
      const execution = await simulateAsync(w, {
        input,
        seed: 42,
        simulatedStartTime: new Date().toISOString(),
        id: crypto.randomUUID(),
        signal,
      });
      addExecution(execution);
      return execution;
    },
    saveNow: async () => {
      if (latest.current) await persist(latest.current);
    },
  };
  return (
    <Context.Provider value={value}>
      {warning && (
        <div className="storage-warning">
          <Alert tone="error">{warning}</Alert>
        </div>
      )}
      {children}
      <Toast message={toast} />
    </Context.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw Error('Workspace provider is missing.');
  return context;
}
