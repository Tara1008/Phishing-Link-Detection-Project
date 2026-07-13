import { motion } from 'framer-motion';
import type { URLFeatures } from '../../types';

interface Props { features: URLFeatures; }

interface FeatureRow {
  label:  string;
  value:  string | number | boolean;
  type:   'text' | 'bool' | 'number' | 'badge';
  good?:  boolean;   // if bool, what value is "good"
}

export default function BreakdownPanel({ features }: Props) {
  const urlRows: FeatureRow[] = [
    { label: 'Protocol',           value: features.protocol?.toUpperCase() || 'N/A', type: 'badge' },
    { label: 'Domain',             value: features.domain       || 'N/A',  type: 'text' },
    { label: 'Subdomain',          value: features.subdomain    || 'None', type: 'text' },
    { label: 'Path',               value: features.path         || '/',    type: 'text' },
    { label: 'TLD',                value: features.tld          || 'N/A',  type: 'text' },
    { label: 'Query String',       value: features.queryString  || 'None', type: 'text' },
  ];

  const metricRows: FeatureRow[] = [
    { label: 'URL Length',         value: features.urlLength,       type: 'number' },
    { label: 'Domain Length',      value: features.domainLength,    type: 'number' },
    { label: 'Number of Dots',     value: features.numDots,         type: 'number' },
    { label: 'Number of Slashes',  value: features.numSlashes,      type: 'number' },
    { label: 'Number of Hyphens',  value: features.numHyphens,      type: 'number' },
    { label: 'Number of Digits',   value: features.numDigits,       type: 'number' },
    { label: 'Special Chars',      value: features.numSpecialChars, type: 'number' },
    { label: 'Query Parameters',   value: features.numQueryParams,  type: 'number' },
    { label: 'Subdomains',         value: features.numSubdomains,   type: 'number' },
    { label: 'Entropy',            value: features.entropy?.toFixed(3) ?? '0', type: 'text' },
  ];

  const boolRows: FeatureRow[] = [
    { label: 'Uses HTTPS',              value: features.hasHttps,         type: 'bool', good: true },
    { label: 'IP Address in URL',       value: features.hasIpAddress,     type: 'bool', good: false },
    { label: 'Suspicious TLD',          value: features.hasSuspiciousTld, type: 'bool', good: false },
    { label: 'URL Shortener',           value: features.isUrlShortener,   type: 'bool', good: false },
    { label: '@ Symbol',                value: features.hasAtSymbol,      type: 'bool', good: false },
    { label: 'Double Slash Redirect',   value: features.hasDoubleSlash,   type: 'bool', good: false },
    { label: 'Encoded Characters',      value: features.hasEncodedChars,  type: 'bool', good: false },
    { label: 'Suspicious Keywords',     value: features.suspiciousWords?.length > 0, type: 'bool', good: false },
  ];

  return (
    <div className="space-y-6">
      {/* URL Components */}
      <Section title="URL Components">
        {urlRows.map((row, i) => (
          <Row key={row.label} row={row} index={i} />
        ))}
      </Section>

      {/* Metrics */}
      <Section title="Numeric Metrics">
        <div className="grid grid-cols-2 gap-2">
          {metricRows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            >
              <span className="text-xs text-slate-500 dark:text-slate-400">{row.label}</span>
              <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">{String(row.value)}</span>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Boolean flags */}
      <Section title="Security Flags">
        {boolRows.map((row, i) => (
          <Row key={row.label} row={row} index={i} />
        ))}
      </Section>

      {/* Suspicious words */}
      {features.suspiciousWords?.length > 0 && (
        <Section title="Detected Keywords">
          <div className="flex flex-wrap gap-2">
            {features.suspiciousWords.map(w => (
              <span
                key={w}
                className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              >
                {w}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ row, index }: { row: FeatureRow; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    >
      <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
      <span className="text-sm font-medium">
        {row.type === 'bool' ? (
          <span className={
            (row.value === row.good)
              ? 'text-green-600 dark:text-green-400 font-semibold'
              : 'text-red-600 dark:text-red-400 font-semibold'
          }>
            {row.value ? 'Yes' : 'No'}
          </span>
        ) : row.type === 'badge' ? (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono ${
            String(row.value) === 'HTTPS'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}>
            {String(row.value)}
          </span>
        ) : (
          <span className="text-slate-800 dark:text-slate-200 font-mono truncate max-w-xs">{String(row.value)}</span>
        )}
      </span>
    </motion.div>
  );
}
