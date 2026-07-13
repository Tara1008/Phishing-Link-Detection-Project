import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { getRiskColor } from '../../types';

interface Props {
  score: number;   // 0–100
  size?: number;   // px, default 200
}

const SIZE     = 200;
const STROKE   = 14;
const RADIUS   = (SIZE - STROKE) / 2;
const CIRC     = 2 * Math.PI * RADIUS;

function getRiskLabel(score: number): string {
  if (score <= 20) return 'Safe';
  if (score <= 40) return 'Low Risk';
  if (score <= 60) return 'Suspicious';
  if (score <= 80) return 'High Risk';
  return 'Very Dangerous';
}

export default function GaugeChart({ score, size = SIZE }: Props) {
  const motionScore = useMotionValue(0);
  const dashOffset  = useTransform(motionScore, v => CIRC - (v / 100) * CIRC * 0.75);
  const color       = getRiskColor(score);

  useEffect(() => {
    const ctrl = animate(motionScore, score, {
      duration: 1.6,
      ease: [0.34, 1.56, 0.64, 1],
    });
    return ctrl.stop;
  }, [score, motionScore]);

  const scaleFactor = size / SIZE;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="rotate-[135deg]"
        >
          {/* Track */}
          <circle
            cx={cx} cy={cy}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeDasharray={`${CIRC * 0.75} ${CIRC * 0.25}`}
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress */}
          <motion.circle
            cx={cx} cy={cy}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={`${CIRC * 0.75} ${CIRC * 0.25}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
          {/* Glow ring */}
          <circle
            cx={cx} cy={cy}
            r={RADIUS + STROKE / 2 + 4}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeDasharray={`${CIRC * 0.75} ${CIRC * 0.25}`}
            opacity={0.15}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
          <motion.span
            className="text-4xl font-black tabular-nums"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>

      {/* Label */}
      <div
        className="px-4 py-1.5 rounded-full text-sm font-semibold"
        style={{ background: color + '18', color }}
      >
        {getRiskLabel(score)}
      </div>
    </div>
  );
}
