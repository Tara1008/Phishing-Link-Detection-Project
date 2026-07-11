// ----------------------------------------------------------------
// Shared TypeScript types for backend
// ----------------------------------------------------------------

export type Classification = 'safe' | 'suspicious' | 'phishing';
export type SecurityGrade  = 'A' | 'B' | 'C' | 'D' | 'F';
export type Severity       = 'safe' | 'info' | 'warning' | 'danger' | 'critical';

export interface URLFeatures {
  // Structural
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
  // Security signals
  hasHttps:         boolean;
  hasHttp:          boolean;
  hasIpAddress:     boolean;
  hasSuspiciousTld: boolean;
  isUrlShortener:   boolean;
  hasAtSymbol:      boolean;
  hasDoubleSlash:   boolean;
  hasEncodedChars:  boolean;
  // Content signals
  entropy:          number;
  suspiciousWords:  string[];
  // Parsed components
  protocol:         string;
  domain:           string;
  subdomain:        string;
  path:             string;
  tld:              string;
  queryString:      string;

  // ── Domain Metrics (GWO / Metaheuristic-optimised features) ──────────────
  // All fields below are OPTIONAL so existing code compiles without change.

  /** Ratio of digit characters to total URL length (0–1). */
  digitRatio?:          number;
  /** Ratio of hyphens to domain length (0–1). */
  hyphenRatio?:         number;
  /** Number of path segments (depth of the URL path). */
  pathDepth?:           number;
  /**
   * Levenshtein-distance-based similarity of the registered domain
   * to a list of known brands (0 = no match, 1 = exact match).
   */
  brandSimilarity?:     number;
  /**
   * Synthetic lexical "age" proxy: 1 for short, common domains
   * that look established; 0 for freshly-coined-looking strings.
   */
  domainAgeProxy?:      number;
  /** Maximum run-length of any repeated character, normalised by domain length. */
  charRepetition?:      number;
  /** Ratio of consonants-only runs > 4 chars in the hostname (DGA indicator). */
  consonantClusterRatio?: number;

  /**
   * Normalised feature vector produced by `toFeatureVector()`.
   * Used as direct input to the ML ensemble classifier.
   * Not persisted; omitted from DB serialisation.
   */
  featureVector?:       number[];
}

export interface AnalysisReason {
  id:          string;
  label:       string;
  description: string;
  severity:    Severity;
  positive:    boolean;  // true = good signal, false = bad signal
  score_delta: number;   // how much this contributed to risk score
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
