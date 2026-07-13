import { motion } from 'framer-motion';
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle, Info, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import type { AnalysisReason, Severity } from '../../types';

interface Props { reasons: AnalysisReason[]; }

const severityConfig: Record<Severity, { icon: typeof CheckCircle2; color: string; badge: string }> = {
  safe:     { icon: CheckCircle2,  color: 'text-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  info:     { icon: Info,          color: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  warning:  { icon: AlertTriangle, color: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  danger:   { icon: XCircle,       color: 'text-red-500',    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  critical: { icon: ShieldAlert,   color: 'text-red-600',    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

function ReasonItem({ reason, index }: { reason: AnalysisReason; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg  = severityConfig[reason.severity];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        aria-expanded={open}
      >
        <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
        <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{reason.label}</span>
        <div className="flex items-center gap-2">
          {reason.score_delta !== 0 && (
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              reason.positive
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                : 'text-red-600 bg-red-50 dark:bg-red-900/20'
            }`}>
              {reason.positive ? '' : '+'}{Math.abs(reason.score_delta)}
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${cfg.badge}`}>
            {reason.severity}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-3 pt-0"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 pl-7 leading-relaxed">
            {reason.description}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ReasonsAccordion({ reasons }: Props) {
  const bad  = reasons.filter(r => !r.positive);
  const good = reasons.filter(r =>  r.positive);

  return (
    <div className="space-y-6">
      {bad.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Risk Indicators ({bad.length})
          </h3>
          <div className="space-y-2">
            {bad.map((r, i) => <ReasonItem key={r.id} reason={r} index={i} />)}
          </div>
        </div>
      )}

      {good.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Good Signals ({good.length})
          </h3>
          <div className="space-y-2">
            {good.map((r, i) => <ReasonItem key={r.id} reason={r} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
