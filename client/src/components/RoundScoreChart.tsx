import { useState } from 'react';

interface RoundScoreChartProps {
  roundScores: Array<{ round: number; myScore: number; oppScore: number }>;
  myName?: string;
  oppName?: string;
}

export function RoundScoreChart({ roundScores, myName = '我', oppName = '对手' }: RoundScoreChartProps) {
  const [hovered, setHovered] = useState<{ type: 'my' | 'opp'; round: number } | null>(null);

  if (!roundScores || roundScores.length === 0) {
    return <div className="text-text-muted text-xs text-center py-4">暂无数据</div>;
  }

  const W = 260;
  const H = 120;
  const PAD = { top: 10, right: 12, bottom: 22, left: 8 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(
    ...roundScores.map(r => Math.max(r.myScore, r.oppScore)),
    1
  );
  const yMax = Math.ceil(maxVal / 5) * 5 || 5;

  const xScale = (i: number) => PAD.left + (i / (roundScores.length - 1 || 1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - (v / yMax) * plotH;

  const myPoints = roundScores.map((r, i) => `${xScale(i)},${yScale(r.myScore)}`).join(' ');
  const oppPoints = roundScores.map((r, i) => `${xScale(i)},${yScale(r.oppScore)}`).join(' ');

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: '#2E75B6' }} />
          <span className="text-[10px] text-text-secondary">{myName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: '#E63946' }} />
          <span className="text-[10px] text-text-secondary">{oppName}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Grid lines */}
        {[0, yMax / 2, yMax].map(v => (
          <line
            key={v}
            x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)}
            stroke="#e2e8f0" strokeWidth="0.5"
          />
        ))}

        {/* Y axis labels */}
        <text x={PAD.left - 2} y={yScale(0) + 4} textAnchor="end" className="text-[8px] fill-slate-400">0</text>
        <text x={PAD.left - 2} y={yScale(yMax / 2) + 3} textAnchor="end" className="text-[8px] fill-slate-400">{yMax / 2}</text>
        <text x={PAD.left - 2} y={yScale(yMax) + 3} textAnchor="end" className="text-[8px] fill-slate-400">{yMax}</text>

        {/* My line */}
        <polyline
          points={myPoints}
          fill="none" stroke="#2E75B6" strokeWidth="1.5" strokeLinejoin="round"
        />
        {/* My data points */}
        {roundScores.map((r, i) => (
          <circle
            key={`my-${i}`}
            cx={xScale(i)} cy={yScale(r.myScore)} r="2.5"
            fill="#2E75B6"
            className="cursor-pointer"
            onMouseEnter={() => setHovered({ type: 'my', round: r.round })}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Opponent line */}
        <polyline
          points={oppPoints}
          fill="none" stroke="#E63946" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="3 1.5"
        />
        {/* Opponent data points */}
        {roundScores.map((r, i) => (
          <circle
            key={`opp-${i}`}
            cx={xScale(i)} cy={yScale(r.oppScore)} r="2.5"
            fill="#E63946"
            className="cursor-pointer"
            onMouseEnter={() => setHovered({ type: 'opp', round: r.round })}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* X axis labels */}
        {roundScores.map((r, i) => (
          <text
            key={`x-${i}`}
            x={xScale(i)} y={H - 4}
            textAnchor="middle"
            className="text-[8px] fill-slate-400"
          >
            {r.round}轮
          </text>
        ))}

        {/* Tooltip */}
        {hovered && (() => {
          const rs = roundScores.find(r => r.round === hovered.round);
          if (!rs) return null;
          const val = hovered.type === 'my' ? rs.myScore : rs.oppScore;
          const label = hovered.type === 'my' ? myName : oppName;
          const cx = xScale(roundScores.findIndex(r => r.round === hovered.round));
          const cy = yScale(val) - 10;
          return (
            <g>
              <rect x={cx - 18} y={cy - 10} width="36" height="14" rx="3" fill="#1e293b" />
              <text x={cx} y={cy} textAnchor="middle" className="text-[9px] fill-white">{label}:{val}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
