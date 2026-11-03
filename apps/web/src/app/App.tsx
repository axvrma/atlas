import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Button, Spinner } from '@atlas/ui';
import { WorkspaceProvider } from '../providers/WorkspaceProvider';
const Landing = lazy(() => import('../pages/Landing'));
const Shell = lazy(() => import('./Shell'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Library = lazy(() => import('../pages/Library'));
const NewWorkflow = lazy(() =>
  import('../pages/Library').then((m) => ({ default: m.NewWorkflow })),
);
const Editor = lazy(() => import('../pages/Editor'));
const Executions = lazy(() => import('../pages/Executions'));
const Debugger = lazy(() => import('../pages/Debugger'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Settings = lazy(() => import('../pages/Settings'));
const Engineering = lazy(() => import('../pages/Engineering'));
const Benchmarks = lazy(() => import('../pages/Benchmarks'));
const NotFound = lazy(() => import('../pages/NotFound'));
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Atlas render failure', error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="not-found">
        <h1>Let’s reconnect.</h1>
        <p>
          The interface encountered an unexpected problem. Reload to recover your saved workspace.
        </p>
        <Button onClick={() => window.location.reload()}>Reload Atlas Studio</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function RouteEffects() {
  const location = useLocation();
  useEffect(() => {
    const name =
      location.pathname === '/app'
        ? 'Workspace'
        : location.pathname === '/'
          ? 'Design workflows. Simulate outcomes. Understand every step.'
          : (location.pathname.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ??
            'Design workflows. Understand every step.');
    document.title = `${name[0]?.toUpperCase()}${name.slice(1)} · Atlas Studio`;
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute('href', `https://atlas.axvrma.com${location.pathname}`);
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceProvider>
        <BrowserRouter>
          <RouteEffects />
          <Suspense
            fallback={
              <div className="app-loading">
                <Spinner />
                <span>Opening Atlas Studio…</span>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Shell />}>
                <Route index element={<Dashboard />} />
                <Route path="workflows" element={<Library />} />
                <Route path="workflows/new" element={<NewWorkflow />} />
                <Route path="workflows/:id" element={<Editor />} />
                <Route path="executions" element={<Executions />} />
                <Route path="executions/:id" element={<Debugger />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              {[
                '/engineering',
                '/engineering/architecture',
                '/engineering/design-system',
                '/engineering/performance',
                '/engineering/testing',
              ].map((path) => (
                <Route key={path} path={path} element={<Engineering />} />
              ))}
              <Route path="/benchmarks" element={<Benchmarks />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </WorkspaceProvider>
    </ErrorBoundary>
  );
}
