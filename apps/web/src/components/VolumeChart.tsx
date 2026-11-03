import { ChartContainer } from '@atlas/ui';
import type { Execution } from '@atlas/contracts';
import { volumeByDay } from '../features/analytics';
export function VolumeChart({ executions }: { executions: Execution[] }) {
  const days = volumeByDay(executions);
  const max = Math.max(...days.map((d) => d.completed + d.failed), 4);
  return (
    <ChartContainer label="Execution volume over the seven days ending at the latest recorded execution">
      <svg viewBox="0 0 660 200" role="img" aria-labelledby="volume-title" className="volume-chart">
        <title id="volume-title">
          Daily execution volume:{' '}
          {days.map((d) => `${d.date}: ${d.completed} completed, ${d.failed} failed`).join('; ')}
        </title>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <text x="4" y={158 - i * 35} className="chart-axis">
              {Math.round((max * i) / 4)}
            </text>
            <line
              x1="30"
              x2="650"
              y1={155 - i * 35}
              y2={155 - i * 35}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
          </g>
        ))}
        {days.map((d, i) => {
          const x = 59 + i * 85;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={155 - (d.completed / max) * 140}
                width="29"
                height={(d.completed / max) * 140}
                rx="3"
                fill="var(--brand)"
                opacity=".75"
              />
              <rect
                x={x + 34}
                y={155 - (d.failed / max) * 140}
                width="10"
                height={(d.failed / max) * 140}
                rx="2"
                fill="var(--red)"
                opacity=".6"
              />
              <text x={x + 20} y="185" textAnchor="middle" className="chart-axis">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartContainer>
  );
}
