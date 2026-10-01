/** Small inline SVG charts, no dependencies. Colours come from the design tokens. */
export function LineChart({ points, height = 160, label }: { points: { x: string; y: number }[]; height?: number; label: string }) {
  const w = 600, h = height, pad = 24;
  const max = Math.max(1, ...points.map((p) => p.y));
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const X = (i: number) => pad + i * step;
  const Y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(i)} ${Y(p.y)}`).join(" ");
  const ticks = [0, Math.round(max / 2), max];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="w-full">
      {ticks.map((t) => <g key={t}><line x1={pad} x2={w - pad} y1={Y(t)} y2={Y(t)} stroke="#E3E3E3" /><text x={pad - 6} y={Y(t) + 4} textAnchor="end" fontSize="10" fill="#6B6B6B">{t}</text></g>)}
      <path d={d} fill="none" stroke="#00BF63" strokeWidth="2" />
      {points.map((p, i) => <circle key={p.x} cx={X(i)} cy={Y(p.y)} r="2.5" fill="#00BF63"><title>{`${p.x}: ${p.y}`}</title></circle>)}
      {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1).map((p) => <text key={p.x} x={X(points.indexOf(p))} y={h - 6} textAnchor="middle" fontSize="10" fill="#6B6B6B">{p.x}</text>)}
    </svg>
  );
}

export function BarChart({ bars, height = 160, label }: { bars: { label: string; value: number }[]; height?: number; label: string }) {
  const w = 600, h = height, pad = 24, gap = 12;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const bw = bars.length ? (w - pad * 2 - gap * (bars.length - 1)) / bars.length : 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="w-full">
      <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} stroke="#E3E3E3" />
      {bars.map((b, i) => {
        const bh = (b.value / max) * (h - pad * 2 - 12);
        const x = pad + i * (bw + gap);
        return (
          <g key={b.label}>
            <rect x={x} y={h - pad - bh} width={bw} height={bh} fill="#00BF63"><title>{`${b.label}: ${b.value}`}</title></rect>
            <text x={x + bw / 2} y={h - pad - bh - 4} textAnchor="middle" fontSize="10" fill="#1A1A1A">{b.value}</text>
            <text x={x + bw / 2} y={h - 6} textAnchor="middle" fontSize="10" fill="#6B6B6B">{b.label.length > 14 ? b.label.slice(0, 13) + "…" : b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
