import type { ScanResult } from '../types';

// ----------------------------------------------------------------
// JSON export — return the full ScanResult object
// ----------------------------------------------------------------
export function toJSON(scan: ScanResult): object {
  return {
    report: {
      generated_at:  new Date().toISOString(),
      tool:          'PhishGuard AI',
      version:       '1.0.0',
      disclaimer:    'This report provides an automated assessment. It does not guarantee that a website is safe or malicious.',
    },
    scan: {
      id:              scan.id,
      url:             scan.url,
      scanned_at:      scan.created_at,
      scan_duration_ms: scan.scan_duration_ms,
    },
    result: {
      classification:  scan.classification,
      risk_score:      scan.risk_score,
      risk_level:      scan.risk_level,
      security_grade:  scan.security_grade,
      confidence:      Math.round(scan.confidence * 100) + '%',
    },
    url_breakdown: {
      protocol:   scan.protocol,
      domain:     scan.domain,
      subdomain:  scan.subdomain,
      path:       scan.path,
      tld:        scan.tld,
    },
    features:        scan.features,
    analysis_reasons: scan.reasons,
    recommendation:  scan.recommendations,
  };
}

// ----------------------------------------------------------------
// CSV export — flat rows for spreadsheet analysis
// ----------------------------------------------------------------
export function toCSV(scans: ScanResult[]): string {
  const headers = [
    'id', 'url', 'classification', 'risk_score', 'risk_level',
    'security_grade', 'confidence', 'protocol', 'domain',
    'tld', 'has_https', 'has_ip', 'num_subdomains',
    'suspicious_words', 'scan_duration_ms', 'created_at',
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = scans.map(s => [
    s.id ?? '',
    s.url,
    s.classification,
    s.risk_score,
    s.risk_level,
    s.security_grade,
    Math.round(s.confidence * 100) + '%',
    s.protocol,
    s.domain,
    s.tld,
    s.features.hasHttps,
    s.features.hasIpAddress,
    s.features.numSubdomains,
    s.features.suspiciousWords.join(';'),
    s.scan_duration_ms,
    s.created_at ?? '',
  ].map(escape).join(','));

  return [headers.join(','), ...rows].join('\n');
}
