import { useState } from 'react';
import { WorkflowNode, Button, Badge, StatusIndicator } from '@atlas/ui';
import { seedWorkflows } from '@atlas/mock-data';
import { simulate } from '@atlas/core';
import { Play, Check, MousePointer2, Plus, Minus } from 'lucide-react';
export function PreviewGraph() {
  const workflow = seedWorkflows()[0]!;
  const [ran, setRan] = useState(false);
  const [scale, setScale] = useState(1);
  const execution = ran
    ? simulate(workflow, {
        input: workflow.sampleInput,
        seed: 42,
        simulatedStartTime: '2026-10-26T09:00:00.000Z',
      })
    : undefined;
  const status = (id: string) => execution?.traces.find((t) => t.nodeId === id)?.status;
  const positions = [
    { id: 'trigger', x: 35, y: 135 },
    { id: 'classify', x: 303, y: 135 },
    { id: 'condition', x: 571, y: 135 },
    { id: 'priority', x: 839, y: 45 },
    { id: 'standard', x: 839, y: 230 },
  ];
  return (
    <div className="preview-window">
      <div className="preview-titlebar">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>
          Customer Support Triage <span className="muted">/ Workflow editor</span>
        </span>
        <Badge tone="purple">Interactive preview</Badge>
      </div>
      <div className="preview-body">
        <div className="preview-rail">
          <MousePointer2 size={17} />
          <span>⌘</span>
          <Plus size={18} />
        </div>
        <div className="preview-canvas">
          <div className="preview-graph" style={{ transform: `scale(${scale})` }}>
            <svg width="1110" height="380" className="preview-edges" aria-hidden="true">
              <path
                d="M263 180H303M531 180H571M799 180C820 180 818 90 839 90M799 180C820 180 818 275 839 275"
                fill="none"
                stroke={ran ? 'var(--brand)' : 'var(--border)'}
                strokeWidth="2"
              />
              <text x="806" y="106" fontSize="9" fill="var(--green)">
                true
              </text>
              <text x="803" y="265" fontSize="9" fill="var(--muted)">
                false
              </text>
            </svg>
            {positions.map((p) => (
              <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y }}>
                <WorkflowNode
                  node={workflow.nodes.find((n) => n.id === p.id)!}
                  status={status(p.id)}
                />
              </div>
            ))}
          </div>
          <div className="preview-label">
            <span className="live-dot" />
            Local sandbox · no external connections
          </div>
          <div className="preview-zoom">
            <button
              aria-label="Zoom out preview"
              onClick={() => setScale(Math.max(0.65, scale - 0.1))}
            >
              <Minus size={13} />
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              aria-label="Zoom in preview"
              onClick={() => setScale(Math.min(1.1, scale + 0.1))}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>
      <div className="preview-footer">
        <span>
          {ran ? (
            <>
              <Check size={13} /> {execution?.traces.filter((t) => t.status === 'completed').length}{' '}
              steps completed · {execution?.durationMs} ms simulated
            </>
          ) : (
            <>
              <span className="status-dot" /> Ready to test your next idea
            </>
          )}
        </span>
        <Button variant="primary" size="sm" onClick={() => setRan(!ran)}>
          {ran ? <Check size={12} /> : <Play size={12} />}{' '}
          {ran ? 'Reset preview' : 'Run simulation'}
        </Button>
        {ran && (
          <span className="sr-only">
            <StatusIndicator status="completed" />
          </span>
        )}
      </div>
    </div>
  );
}
