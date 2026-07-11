import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldX, Copy, Clock, Zap } from 'lucide-react';
import type { ScanResult } from '../../types';
import { getRiskColor, getClassificationIcon } from '../../types';
import GaugeChart from './GaugeChart';
import toast from 'react-hot-toast';

interface Props { result: ScanResult; }

const gradeColors: Record<string, string> = {
  A: 'text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-900',
  B: 'text-lime-600   bg-lime-50   dark:bg-lime-950/30   dark:text-lime-400   border-lime-200   dark:border-lime-900',
  C: 'text-amber-600  bg-amber-50  dark:bg-amber-950/30  dark:text-amber-400  border-amber-200  dark:border-amber-900',
  D: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-900',
  F: 'text-red-600    bg-red-50    dark:bg-red-950/30    dark:text-red-400    border-red-200    dark:border-red-900',
};

const classificationConfig = {
  safe:       { icon: Shield,      color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-900', label: 'Safe' },
  suspicious: { icon: ShieldAlert, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900', label: 'Suspicious' },
  phishing:   { icon: ShieldX,     color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-950/20',     border: 'border-red-200 dark:border-red-900',     label: 'Phishing' },
};

export default function ResultCard({ result }: Props) {
  const cfg   = classificationConfig[result.classification];
  const Icon  = cfg.icon;
  const color = getRiskColor(result.risk_score);

  const copyResult = () => {
    const text = `PhishGuard AI Result\nURL: ${result.url}\nClassification: ${result.classification.toUpperCase()}\nRisk Score: ${result.risk_score}/100\nSecurity Grade: ${result.security_grade}\nConfidence: ${Math.round(result.confidence * 100)}%`;
    navigator.clipboard.writeText(text);
    toast.success('Result copied!', { icon: '📋' });
  };

  const stats = [
    { label: 'Risk Score',  value: `${result.risk_score}/100`,               color },
    { label: 'Confidence',  value: `${Math.round(result.confidence * 100)}%`, color: '#6366f1' },
    { label: 'Detection',   value: `${result.scan_duration_ms}ms`,            color: '#14b8a6' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden shadow-card`}
    >
      {/* Header strip */}
      <div className={`px-6 py-4 flex items-center justify-between ${cfg.bg} border-b ${cfg.border}`}>
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className={`p-2.5 rounded-xl ${cfg.bg} border ${cfg.border}`}
          >
            <Icon className={`w-6 h-6 ${cfg.color}`} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{getClassificationIcon(result.classification)} {cfg.label}</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border font-mono ${gradeColors[result.security_grade]}`}>
                Grade {result.security_grade}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate max-w-sm">{result.url}</p>
          </div>
        </div>
        <button
          onClick={copyResult}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-white/60 dark:hover:bg-slate-800 transition-all"
          title="Copy result"
          aria-label="Copy result"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center bg-white/50 dark:bg-slate-900/50">
        {/* Gauge */}
        <div className="flex justify-center">
          <GaugeChart score={result.risk_score} size={180} />
        </div>

        {/* Stats */}
        <div className="col-span-2">
          <div className="grid grid-cols-3 gap-4 mb-5">
            {stats.map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quick details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Risk Level"   value={result.risk_level} />
            <Detail label="Protocol"     value={result.protocol?.toUpperCase() || 'N/A'} />
            <Detail label="Domain"       value={result.domain || 'N/A'} />
            <Detail label="TLD"          value={result.tld || 'N/A'} />
            <Detail label="Threat"       value={result.classification === 'phishing' ? 'Phishing Attack' : result.classification === 'suspicious' ? 'Potential Threat' : 'No Threat Detected'} />
            <Detail label="Scanned"      value={result.created_at ? new Date(result.created_at).toLocaleTimeString() : 'Just now'} />
          </div>
        </div>
      </div>

      {/* Recommendation footer */}
      <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-700/40">
        <div className="flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{result.recommendations}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-400 dark:text-slate-500 shrink-0">{label}:</span>
      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{value}</span>
    </div>
  );
}
