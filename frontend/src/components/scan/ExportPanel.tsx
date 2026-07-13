import { Download, FileJson, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ScanResult } from '../../types';
import toast from 'react-hot-toast';

interface Props { result: ScanResult; }

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPanel({ result }: Props) {
  const exportJSON = () => {
    const data = {
      report:   { generated_at: new Date().toISOString(), tool: 'PhishGuard AI', version: '1.0.0' },
      scan:     { id: result.id, url: result.url, scanned_at: result.created_at },
      result:   {
        classification: result.classification,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        security_grade: result.security_grade,
        confidence: `${Math.round(result.confidence * 100)}%`,
      },
      url_breakdown: { protocol: result.protocol, domain: result.domain, subdomain: result.subdomain, path: result.path, tld: result.tld },
      features:  result.features,
      reasons:   result.reasons,
      recommendation: result.recommendations,
    };
    downloadFile(JSON.stringify(data, null, 2), `phishguard-${result.id ?? 'report'}.json`, 'application/json');
    toast.success('JSON exported!', { icon: '📄' });
  };

  const exportCSV = () => {
    const headers = ['URL', 'Classification', 'Risk Score', 'Security Grade', 'Confidence', 'Risk Level', 'Protocol', 'Domain', 'TLD', 'Has HTTPS', 'Has IP', 'Subdomains', 'Keywords', 'Scanned At'];
    const esc = (v: unknown) => { const s = String(v ?? ''); return s.includes(',') ? `"${s}"` : s; };
    const row = [
      result.url, result.classification, result.risk_score, result.security_grade,
      `${Math.round(result.confidence * 100)}%`, result.risk_level, result.protocol,
      result.domain, result.tld, result.features.hasHttps, result.features.hasIpAddress,
      result.features.numSubdomains, result.features.suspiciousWords?.join(';') ?? '',
      result.created_at ?? new Date().toISOString(),
    ].map(esc);
    const csv = [headers.join(','), row.join(',')].join('\n');
    downloadFile(csv, `phishguard-${result.id ?? 'report'}.csv`, 'text/csv');
    toast.success('CSV exported!', { icon: '📊' });
  };

  const printReport = () => {
    window.print();
    toast.success('Print dialog opened', { icon: '🖨️' });
  };

  const actions = [
    { label: 'Export JSON', icon: FileJson,  onClick: exportJSON,   color: 'from-indigo-500 to-purple-600' },
    { label: 'Export CSV',  icon: FileText,  onClick: exportCSV,    color: 'from-teal-500 to-cyan-600' },
    { label: 'Print PDF',   icon: Download,  onClick: printReport,  color: 'from-slate-600 to-slate-700' },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(({ label, icon: Icon, onClick, color }, i) => (
        <motion.button
          key={label}
          onClick={onClick}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${color} text-white text-sm font-semibold rounded-xl shadow-sm transition-all`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </motion.button>
      ))}
    </div>
  );
}
