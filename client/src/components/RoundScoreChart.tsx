import { useState } from 'react';

interface RoundScoreChartProps {
  roundScores: Array<{ round: number; myScore: number; oppScore: number }>;
  myName?: string;
  oppName?: string;
}

export function RoundScoreChart({ roundScores, myName = '我', oppName = '对手' }: RoundScoreChartProps) {
  const [hovered, setHovered] = useState<{ type: 'my' | 'opp'; round: number } | null>(null);
  if (!roundScores?.length) return <div className="text-text-muted text-xs text-center py-4 font-body">暂无数据</div>;

  const W = 260, H = 120, PAD = { top: 10, right: 12, bottom: 22, left: 8 };
  const plotW = W - PAD.left - PAD.right, plotH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...roundScores.map(r => Math.max(r.myScore, r.oppScore)), 1);
  const yMax = Math.ceil(maxVal / 5) * 5 || 5;
  const xScale = (i: number) => PAD.left + (i / (roundScores.length-1||1)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const myPts = roundScores.map((r,i) => `${xScale(i)},${yScale(r.myScore)}`).join(' ');
  const oppPts = roundScores.map((r,i) => `${xScale(i)},${yScale(r.oppScore)}`).join(' ');

  return (
    <div className="glass-card-sm p-3">
      <div className="flex items-center gap-4 mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[3px] rounded-full bg-cooperate" />
          <span className="text-[10px] font-display font-semibold text-text-primary">{myName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-[3px] rounded-full bg-betray" />
          <span className="text-[10px] font-display font-semibold text-text-secondary">{oppName}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, yMax/2, yMax].map(v => <line key={v} x1={PAD.left} y1={yScale(v)} x2={W-PAD.right} y2={yScale(v)} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />)}
        <text x={PAD.left-2} y={yScale(0)+4} textAnchor="end" className="text-[8px] fill-text-muted">0</text>
        <text x={PAD.left-2} y={yScale(yMax/2)+3} textAnchor="end" className="text-[8px] fill-text-muted">{yMax/2}</text>
        <text x={PAD.left-2} y={yScale(yMax)+3} textAnchor="end" className="text-[8px] fill-text-muted">{yMax}</text>
        <polyline points={myPts} fill="none" stroke="#FF6B35" strokeWidth="3" strokeLinejoin="round" />
        {roundScores.map((r,i) => <rect key={`m-${i}`} x={xScale(i)-3} y={yScale(r.myScore)-3} width="6" height="6" rx="1.5" fill="#FF6B35" className="cursor-pointer" onMouseEnter={()=>setHovered({type:'my',round:r.round})} onMouseLeave={()=>setHovered(null)} />)}
        <polyline points={oppPts} fill="none" stroke="#E83F6F" strokeWidth="3" strokeLinejoin="round" strokeDasharray="6 3" />
        {roundScores.map((r,i) => <rect key={`o-${i}`} x={xScale(i)-3} y={yScale(r.oppScore)-3} width="6" height="6" rx="1.5" fill="#E83F6F" className="cursor-pointer" onMouseEnter={()=>setHovered({type:'opp',round:r.round})} onMouseLeave={()=>setHovered(null)} />)}
        {roundScores.map((r,i) => <text key={`x-${i}`} x={xScale(i)} y={H-4} textAnchor="middle" className="text-[8px] fill-text-muted">{r.round}轮</text>)}
        {hovered && (() => {
          const rs = roundScores.find(r=>r.round===hovered.round);
          if (!rs) return null;
          const val = hovered.type==='my'?rs.myScore:rs.oppScore;
          const label = hovered.type==='my'?myName:oppName;
          const cx = xScale(roundScores.findIndex(r=>r.round===hovered.round));
          const cy = yScale(val)-10;
          return <g><rect x={cx-18} y={cy-10} width="36" height="14" rx="4" fill="#1E1E2E" /><text x={cx} y={cy} textAnchor="middle" className="text-[9px] fill-white font-mono">{label}:{val}</text></g>;
        })()}
      </svg>
    </div>
  );
}
