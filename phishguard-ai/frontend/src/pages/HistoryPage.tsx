import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Search, RefreshCcw, History, ExternalLink } from 'lucide-react';
import { fetchHistory, deleteScanById, clearAllHistory } from '../hooks/useAnalyze';
import type { ScanResult } from '../types';
import { getRiskColor } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const classificationBadge: Record<string, string> = {
  safe:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  suspicious: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  phishing:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function HistoryPage() {
  const [scans,   setScans]   = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(100);
      setScans(data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id: number) => {
    try {
      await deleteScanById(id);
      setScans(s => s.filter(r => r.id !== id));
      toast.success('Scan deleted');
    } catch { toast.error('Delete failed'); }
  };

  const clearAll = async () => {
    if (!confirm('Clear all scan history?')) return;
    try {
      await clearAllHistory();
      setScans([]);
      toast.success('History cleared');
    } catch { toast.error('Clear failed'); }
  };

  const filtered = scans.filter(s =>
    s.url.toLowerCase().includes(query.toLowerCase()) ||
    s.classification.includes(query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-500" /> Scan History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All scans stored in MySQL</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 hover:border-indigo-300 transition-all" title="Refresh">
            <RefreshCcw className="w-4 h-4" />
          </button>
          {scans.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by URL or classification…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      {/* Stats */}
      {scans.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Scans', value: scans.length, color: '#6366f1' },
            { label: 'Phishing',    value: scans.filter(s => s.classification === 'phishing').length,   color: '#ef4444' },
            { label: 'Safe',        value: scans.filter(s => s.classification === 'safe').length,       color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center shadow-sm">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <History className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
          <p className="text-slate-400 dark:text-slate-600 text-sm">
            {query ? 'No results found' : 'No scans yet — scan your first URL!'}
          </p>
          <button onClick={() => navigate('/scan')} className="mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl">
            Scan a URL
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                  {['URL', 'Classification', 'Risk', 'Grade', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((scan, i) => (
                  <motion.tr
                    key={scan.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate block" title={scan.url}>{scan.url}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${classificationBadge[scan.classification]}`}>
                        {scan.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold tabular-nums" style={{ color: getRiskColor(scan.risk_score) }}>{scan.risk_score}</span>
                      <span className="text-slate-400 text-xs">/100</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{scan.security_grade}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {scan.created_at ? new Date(scan.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { navigator.clipboard.writeText(scan.url); toast.success('URL copied'); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
                          title="Copy URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => scan.id !== undefined && del(scan.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
