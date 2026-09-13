/**
 * A small hand-rolled SVG line chart — this app needs exactly two of these
 * (weight trend, e1RM trend), which doesn't justify pulling in a charting
 * library (consistent with the M0 decision on ProgressRing/Button/etc:
 * hand-roll small primitives rather than take a dependency for a handful
 * of uses).
 */
export function LineChart({
  points,
  height = 160,
  formatValue,
  tone = "#3D7FD4", // --color-load-blue
}: {
  points: { x: string; y: number }[];
  height?: number;
  formatValue?: (v: number) => string;
  tone?: string;
}) {
  if (points.length === 0) {
    return <div style={{ height }} className="flex items-center justify-center text-sm text-ink-muted">Not enough data yet.</div>;
  }
  if (points.length === 1) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <span className="metric text-2xl text-ink-primary">{formatValue ? formatValue(points[0].y) : points[0].y}</span>
      </div>
    );
  }

  const width = 600;
  const padding = 24;
  const values = points.map((p) => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.y - min) / range) * (height - padding * 2);
    return { x, y, value: p.y, label: p.x };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} role="img" aria-label={`Trend from ${formatValue ? formatValue(min) : min} to ${formatValue ? formatValue(max) : max}`}>
      <path d={path} fill="none" stroke={tone} strokeWidth={2} />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 4 : 2.5} fill={tone} />
      ))}
      <text x={last.x} y={last.y - 10} textAnchor="end" fontSize={13} fill="#F2F0ED" className="font-medium">
        {formatValue ? formatValue(last.value) : last.value}
      </text>
    </svg>
  );
}
