'use client';

import { WEEKDAY_LABEL } from '@/lib/format';
import type { HourlyOccupancy, WeekdayOccupancy } from '@studioemar/shared';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

function barFill(percent: number): string {
  return percent >= 90 ? 'var(--color-accent)' : 'var(--color-foreground)';
}

export function HourlyOccupancyChart({ data }: { data: HourlyOccupancy[] }) {
  const chartData = data.map((item) => ({
    ...item,
    label: item.hour.slice(0, 2) + 'h',
    fill: barFill(item.occupancyPercent),
  }));

  if (chartData.length === 0) {
    return <p className="text-muted-foreground">Sem horários para exibir.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <Bar dataKey="occupancyPercent" radius={[4, 4, 0, 0]}>
            {chartData.map((item) => (
              <Cell key={item.hour} fill={item.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekdayOccupancyList({ data }: { data: WeekdayOccupancy[] }) {
  return (
    <div className="flex flex-col gap-4">
      {data.map((item) => (
        <div key={item.weekday} className="flex items-center gap-4">
          <span className="w-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {WEEKDAY_LABEL[item.weekday]}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{
                width: `${item.occupancyPercent}%`,
                background:
                  item.occupancyPercent >= 90
                    ? 'linear-gradient(90deg, var(--color-accent), var(--color-accent-end))'
                    : undefined,
              }}
            />
          </div>
          <span className="w-12 text-right font-semibold text-foreground">
            {item.occupancyPercent}%
          </span>
        </div>
      ))}
    </div>
  );
}
