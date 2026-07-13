// ── Shared TypeScript types (frontend) ────────────────────────────

export type Classification = 'safe' | 'suspicious' | 'phishing';
export type SecurityGrade  = 'A' | 'B' | 'C' | 'D' | 'F';
export type Severity       = 'safe' | 'info' | 'warning' | 'danger' | 'critical';

export interface URLFeatures {
  urlLength:        number;
  domainLength:     number;
  numDots:          number;
  numSlashes:       number;
  numHyphens:       number;
  numUnderscores:   number;
  numDigits:        number;
  numSpecialChars:  number;
  numQueryParams:   number;
  numSubdomains:    number;
  hasHttps:         boolean;
  hasHttp:          boolean;
  hasIpAddress:     boolean;
  hasSuspiciousTld: boolean;
  isUrlShortener:   boolean;
  hasAtSymbol:      boolean;
  hasDoubleSlash:   boolean;
  hasEncodedChars:  boolean;
  entropy:          number;
  suspiciousWords:  string[];
  protocol:         string;
  domain:           string;
  subdomain:        string;
  path:             string;
  tld:              string;
  queryString:      string;
}

export interface AnalysisReason {
  id:          string;
  label:       string;
  description: string;
  severity:    Severity;
  positive:    boolean;
  score_delta: number;
}

export interface ScanResult {
  id?:              number;
  url:              string;
  protocol:         string;
  domain:           string;
  subdomain:        string;
  path:             string;
  tld:              string;
  risk_score:       number;
  classification:   Classification;
  confidence:       number;
  security_grade:   SecurityGrade;
  risk_level:       string;
  features:         URLFeatures;
  reasons:          AnalysisReason[];
  recommendations:  string;
  scan_duration_ms: number;
  session_id:       string;
  created_at?:      string;
}

export interface ScanStats {
  total_scans:      number;
  safe_count:       number;
  suspicious_count: number;
  phishing_count:   number;
  avg_risk_score:   number;
  phishing_pct:     number;
  safe_pct:         number;
  first_scan:       string | null;
  last_scan:        string | null;
}

// Gauge color helpers
export function getRiskColor(score: number): string {
  if (score <= 20) return '#22c55e';
  if (score <= 40) return '#84cc16';
  if (score <= 60) return '#f59e0b';
  if (score <= 80) return '#f97316';
  return '#ef4444';
}

export function getRiskBgClass(classification: Classification): string {
  switch (classification) {
    case 'safe':       return 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20';
    case 'suspicious': return 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20';
    case 'phishing':   return 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20';
  }
}

export function getClassificationIcon(c: Classification): string {
  switch (c) {
    case 'safe':       return '✅';
    case 'suspicious': return '⚠️';
    case 'phishing':   return '🚨';
  }
}
