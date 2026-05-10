import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SegmentationClass } from '../../types';

interface DonutChartProps {
  data: SegmentationClass[];
  size?: number;
}

function formatPixels(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M px`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K px`;
  return `${Math.round(value)} px`;
}

export function DonutChart({ data, size = 200 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={0}
            dataKey="percentage"
            animationBegin={0}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="rgba(7, 17, 28, 0.8)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as SegmentationClass;
                return (
                  <div className="glass-panel px-3 py-2 text-sm">
                    <p className="font-medium" style={{ color: data.color }}>
                      {data.name}
                    </p>
                    <p className="text-slate-300">{data.percentage}%</p>
                    <p className="text-slate-400 text-xs">{formatPixels(data.area)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold font-display text-white">{total.toFixed(1)}%</span>
        <span className="text-xs text-slate-400">Coverage</span>
      </div>
    </div>
  );
}
