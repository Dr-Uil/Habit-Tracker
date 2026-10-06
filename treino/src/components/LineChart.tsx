import { useState } from 'react';

export interface Point {
  x: number; // timestamp
  y: number;
  label?: string;
}

/** Gráfico de linha simples em SVG (sem dependências). */
export function LineChart({ points, unit = '', height = 160, decimals = 1 }: { points: Point[]; unit?: string; height?: number; decimals?: number }) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return <div className="py-8 text-center text-sm text-slate-500">Sem dados ainda.</div>;

  const W = 340;
  const H = height;
  const padL = 36;
  const padR = 12;
  const padT = 14;
  const padB = 22;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const padY = (maxY - minY) * 0.12;
  minY -= padY;
  maxY += padY;
  const sx = (x: number) => (maxX === minX ? (padL + W - padR) / 2 : padL + ((x - minX) / (maxX - minX)) * (W - padL - padR));
  const sy = (y: number) => padT + (1 - (y - minY) / (maxY - minY)) * (H - padT - padB);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${sx(points[points.length - 1].x).toFixed(1)},${H - padB} L${sx(points[0].x).toFixed(1)},${H - padB} Z`;
  const fmt = (n: number) => n.toFixed(decimals).replace('.', ',');
  const ticks = [minY + padY, (minY + maxY) / 2, maxY - padY];
  const dateLabel = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const sel = active != null ? points[active] : points[points.length - 1];

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-slate-400">{sel.label ?? dateLabel(sel.x)}</span>
        <span className="font-semibold tabular-nums">
          {fmt(sel.y)} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" onMouseLeave={() => setActive(null)}>
        <defs>
          <linearGradient id="lc-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} stroke="#1e293b" strokeDasharray="3 4" />
            <text x={padL - 6} y={sy(t) + 4} fontSize="10" textAnchor="end" fill="#64748b">
              {fmt(t)}
            </text>
          </g>
        ))}
        <text x={padL} y={H - 6} fontSize="10" fill="#64748b">
          {dateLabel(minX)}
        </text>
        <text x={W - padR} y={H - 6} fontSize="10" textAnchor="end" fill="#64748b">
          {dateLabel(maxX)}
        </text>
        {points.length > 1 && <path d={area} fill="url(#lc-grad)" />}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={active === i ? 5 : 3}
            fill={active === i ? 'var(--accent)' : '#0b1120'}
            stroke="var(--accent)"
            strokeWidth="2"
          />
        ))}
        {points.map((p, i) => (
          <rect
            key={`h${i}`}
            x={sx(p.x) - 12}
            y={0}
            width={24}
            height={H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onTouchStart={() => setActive(i)}
            onClick={() => setActive(i)}
          />
        ))}
      </svg>
    </div>
  );
}

/** Barras horizontais com faixa-alvo (para volume semanal por músculo). */
export function TargetBars({ rows }: { rows: { label: string; value: number; target: [number, number]; priority?: boolean }[] }) {
  const max = Math.max(...rows.map((r) => Math.max(r.value, r.target[1]))) * 1.08;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const inRange = r.value >= r.target[0] && r.value <= r.target[1];
        return (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-300">
                {r.label} {r.priority && <span className="text-accent">★</span>}
              </span>
              <span className={inRange ? 'text-emerald-300' : 'text-amber-300'}>
                {r.value.toString().replace('.', ',')} séries <span className="text-slate-500">(meta {r.target[0]}–{r.target[1]})</span>
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-slate-800">
              <div
                className="absolute top-0 h-full rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30"
                style={{ left: `${(r.target[0] / max) * 100}%`, width: `${((r.target[1] - r.target[0]) / max) * 100}%` }}
              />
              <div className="absolute top-0 h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%`, opacity: 0.85 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
