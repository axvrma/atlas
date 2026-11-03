import { performance } from 'node:perf_hooks';
import { cpus, platform, arch } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { simulate, validateGraph } from '@atlas/core';
import type { Workflow } from '@atlas/contracts';
export function stressWorkflow(count: number): Workflow {
  return {
    id: `stress-${count}`,
    name: `${count}-node stress graph`,
    description: 'Generated deterministic linear graph for CPU measurements.',
    status: 'ready',
    category: 'Benchmark',
    createdAt: '2026-10-26T00:00:00.000Z',
    updatedAt: '2026-10-26T00:00:00.000Z',
    sampleInput: { value: 1 },
    nodes: Array.from({ length: count }, (_, i) => ({
      id: `n${i}`,
      name: `Step ${i}`,
      kind:
        i === 0
          ? ('trigger' as const)
          : i === count - 1
            ? ('end' as const)
            : ('transform' as const),
      description: 'Benchmark node',
      position: { x: i * 260, y: 0 },
      config: i > 0 && i < count - 1 ? { assignments: { value: 1 } } : {},
    })),
    edges: Array.from({ length: count - 1 }, (_, i) => ({
      id: `e${i}`,
      source: `n${i}`,
      target: `n${i + 1}`,
    })),
  };
}
function measure(fn: () => unknown) {
  const values = [];
  for (let i = 0; i < 5; i++) fn();
  for (let i = 0; i < 30; i++) {
    const start = performance.now();
    fn();
    values.push(performance.now() - start);
  }
  values.sort((a, b) => a - b);
  return { median: values[15]!, p95: values[28]! };
}
const report = {
  generatedAt: new Date().toISOString(),
  environment: `Node ${process.version} · ${platform()} ${arch()} · ${cpus()[0]?.model ?? 'unknown CPU'}`,
  samples: 30,
  methodology:
    '5 warm-up runs, 30 sequential timed samples; valid linear graph, small flat payload; simulation includes validation and trace cloning.',
  results: [10, 50, 100, 250].map((nodes) => {
    const workflow = stressWorkflow(nodes);
    const validation = measure(() => validateGraph(workflow));
    const simulation = measure(() =>
      simulate(workflow, {
        input: workflow.sampleInput,
        seed: 42,
        simulatedStartTime: '2026-10-26T00:00:00.000Z',
      }),
    );
    return {
      nodes,
      validationMedianMs: validation.median,
      validationP95Ms: validation.p95,
      simulationMedianMs: simulation.median,
      simulationP95Ms: simulation.p95,
    };
  }),
};
mkdirSync('apps/web/public/reports', { recursive: true });
writeFileSync('apps/web/public/reports/engine.json', JSON.stringify(report, null, 2) + '\n');
console.table(report.results);
console.log(report.environment);
