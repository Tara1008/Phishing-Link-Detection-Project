import type { URLFeatures, Classification, SecurityGrade } from '../types';
import { toFeatureVector } from './featureExtractor';
import { ensemblePredict, FEATURE_IMPORTANCES } from './mlEnsemble';

// ----------------------------------------------------------------
// Legacy rule definitions — DEPRECATED
// Kept exported so `explanationGenerator.ts` compiles without change.
// The calculateRisk function no longer uses RULES for scoring;
// classification is now driven by the ML ensemble.
// ----------------------------------------------------------------

interface Rule {
  id:          string;
  check:       (f: URLFeatures) => boolean;
  delta:       number;
  label:       string;
  description: string;
  positive:    boolean;
}

/**
 * @deprecated Use the ML ensemble (mlEnsemble.ts) instead.
 * Retained for backward-compat with explanationGenerator.ts.
 */
export const RULES: Rule[] = [
  // ── Good signals ─────────────────────────────────────────────
  {
    id: 'https', check: f => f.hasHttps, delta: -8,
    label: 'Uses HTTPS',
    description: 'The connection is encrypted using HTTPS, which is a good security practice.',
    positive: true,
  },
  {
    id: 'normal_length', check: f => f.urlLength <= 54, delta: -5,
    label: 'Normal URL length',
    description: 'The URL length is within the typical range for legitimate websites.',
    positive: true,
  },
  {
    id: 'no_ip', check: f => !f.hasIpAddress, delta: -5,
    label: 'No IP address in URL',
    description: 'The URL uses a proper domain name instead of a raw IP address.',
    positive: true,
  },
  {
    id: 'no_suspicious_tld', check: f => !f.hasSuspiciousTld, delta: -3,
    label: 'Normal top-level domain',
    description: 'The domain uses a common, trusted TLD (e.g., .com, .org, .net).',
    positive: true,
  },
  {
    id: 'no_shortener', check: f => !f.isUrlShortener, delta: -3,
    label: 'Not a URL shortener',
    description: 'The URL does not appear to redirect through a URL shortening service.',
    positive: true,
  },
  {
    id: 'low_subdomains', check: f => f.numSubdomains <= 1, delta: -3,
    label: 'Normal subdomain structure',
    description: 'The domain has a typical number of subdomains.',
    positive: true,
  },
  // ── Bad signals ──────────────────────────────────────────────
  {
    id: 'no_https', check: f => !f.hasHttps, delta: 15,
    label: 'No HTTPS (HTTP only)',
    description: 'The website does not use HTTPS encryption, making it vulnerable to interception.',
    positive: false,
  },
  {
    id: 'ip_address', check: f => f.hasIpAddress, delta: 35,
    label: 'IP address used instead of domain',
    description: 'The URL uses a raw IP address. Legitimate sites rarely do this.',
    positive: false,
  },
  {
    id: 'suspicious_tld', check: f => f.hasSuspiciousTld, delta: 22,
    label: 'Suspicious top-level domain',
    description: 'The top-level domain (TLD) of the URL is commonly associated with phishing and spam sites.',
    positive: false,
  },
  {
    id: 'url_shortener', check: f => f.isUrlShortener, delta: 20,
    label: 'URL shortening service detected',
    description: 'Short URLs can mask malicious destinations. Always expand them before visiting.',
    positive: false,
  },
  {
    id: 'long_url', check: f => f.urlLength > 75, delta: 10,
    label: 'Long URL detected',
    description: 'Unusually long URLs are often used to hide the true destination or add confusion.',
    positive: false,
  },
  {
    id: 'very_long_url', check: f => f.urlLength > 120, delta: 12,
    label: 'Very long URL (likely obfuscated)',
    description: 'Extremely long URLs are a strong phishing indicator.',
    positive: false,
  },
  {
    id: 'many_hyphens', check: f => f.numHyphens > 3, delta: 10,
    label: 'Excessive hyphens in URL',
    description: 'Multiple hyphens are sometimes used to mimic legitimate brand names (e.g., paypal-secure.com).',
    positive: false,
  },
  {
    id: 'many_dots', check: f => f.numDots > 4, delta: 12,
    label: 'Many dots in URL',
    description: 'An unusually high number of dots may indicate deep subdomain abuse.',
    positive: false,
  },
  {
    id: 'many_subdomains', check: f => f.numSubdomains >= 3, delta: 15,
    label: 'Multiple subdomains detected',
    description: 'Three or more subdomains are used to make a malicious domain look like a trusted brand.',
    positive: false,
  },
  {
    id: 'at_symbol', check: f => f.hasAtSymbol, delta: 25,
    label: '@ symbol in URL',
    description: 'An @ in the URL causes browsers to treat the text before it as credentials, masking the real destination.',
    positive: false,
  },
  {
    id: 'double_slash', check: f => f.hasDoubleSlash, delta: 15,
    label: 'Double slash redirect pattern',
    description: 'A double slash (//) in the path may indicate URL redirection abuse.',
    positive: false,
  },
  {
    id: 'encoded_chars', check: f => f.hasEncodedChars, delta: 8,
    label: 'Encoded characters detected',
    description: 'Percent-encoded characters can be used to obfuscate malicious content.',
    positive: false,
  },
  {
    id: 'high_entropy', check: f => f.entropy > 3.8, delta: 10,
    label: 'High domain entropy (randomised)',
    description: 'The domain appears algorithmically generated, a common trait of phishing infrastructure.',
    positive: false,
  },
  {
    id: 'many_query_params', check: f => f.numQueryParams > 5, delta: 8,
    label: 'Many query parameters',
    description: 'An unusually large number of query parameters can be used for tracking or obfuscation.',
    positive: false,
  },
  {
    id: 'suspicious_words',
    check: f => f.suspiciousWords.length > 0,
    delta: 0,
    label: 'Suspicious keywords detected',
    description: '',
    positive: false,
  },
];

// ----------------------------------------------------------------
// RiskResult — interface unchanged for frontend compatibility
// ----------------------------------------------------------------
export interface RiskResult {
  riskScore:      number;
  classification: Classification;
  securityGrade:  SecurityGrade;
  riskLevel:      string;
  confidence:     number;
  triggeredRules: Array<{ ruleId: string; delta: number }>;
  /** Feature importances from the ML ensemble (for explainability). */
  featureImportances: Record<string, number>;
  /** Which inference path was used by the ensemble. */
  modelUsed: 'hybrid-rf-xgb' | 'student-linear';
}

// ----------------------------------------------------------------
// calculateRisk — now ML-driven
// ----------------------------------------------------------------
/**
 * Calculates phishing risk using the Hybrid RF+XGBoost ensemble.
 *
 * Pipeline:
 *   URLFeatures
 *     → toFeatureVector()          (normalise to [0,1] tensor)
 *     → ensemblePredict()          (RF 40% + XGBoost 60%)
 *     → rawScore [0,1]
 *     → riskScore [0,100] clamped  (frontend-safe)
 *     → classification / grade / riskLevel
 *     → triggeredRules (top feature importances as pseudo-rule IDs)
 *
 * The RiskResult interface is preserved in full for frontend compatibility.
 */
export function calculateRisk(features: URLFeatures): RiskResult {
  // ── 1. Obtain or rebuild the feature vector ──────────────────────────────
  const fv = features.featureVector?.length === 26
    ? features.featureVector
    : toFeatureVector(features);

  // ── 2. Run the hybrid ensemble ────────────────────────────────────────────
  const { rawScore, confidence, featureImportances, modelUsed } = ensemblePredict(fv);

  // ── 3. Map probability [0,1] → risk score [0,100] ─────────────────────────
  // Apply a calibration curve so the output distribution matches the old rule
  // system: safe URLs cluster near 10–25, phishing near 75–95.
  const riskScore = Math.round(Math.max(0, Math.min(100, calibrate(rawScore) * 100)));

  // ── 4. Derive classification, grade, risk level ───────────────────────────
  const classification = classify(riskScore);
  const securityGrade  = grade(riskScore);
  const riskLevel      = riskLevelLabel(riskScore);

  // ── 5. Build triggeredRules from top feature importances ─────────────────
  // This preserves the shape expected by explanationGenerator.generateReasons().
  // delta is mapped from feature importance × 100 so bars scale naturally.
  const triggeredRules = buildTriggeredRules(features, featureImportances);

  return {
    riskScore,
    classification,
    securityGrade,
    riskLevel,
    confidence,
    triggeredRules,
    featureImportances,
    modelUsed,
  };
}

// ----------------------------------------------------------------
// Calibration curve — sigmoid-based stretching
// ----------------------------------------------------------------
/**
 * Stretch the raw [0,1] probability into a calibrated score that:
 *  - Pushes genuinely safe URLs below 0.25
 *  - Pushes clear phishing above 0.75
 *  - Keeps borderline cases in the 0.3–0.65 band
 */
function calibrate(p: number): number {
  // Logit-transform then re-sigmoid with steeper slope
  const logit = Math.log(p / (1 - p + 1e-9));
  return sigmoid(logit * 1.4);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ----------------------------------------------------------------
// Classification thresholds (unchanged from original)
// ----------------------------------------------------------------
function classify(score: number): Classification {
  if (score <= 30) return 'safe';
  if (score <= 60) return 'suspicious';
  return 'phishing';
}

function grade(score: number): SecurityGrade {
  if (score <= 20) return 'A';
  if (score <= 40) return 'B';
  if (score <= 60) return 'C';
  if (score <= 80) return 'D';
  return 'F';
}

function riskLevelLabel(score: number): string {
  if (score <= 20) return 'Safe';
  if (score <= 40) return 'Low Risk';
  if (score <= 60) return 'Suspicious';
  if (score <= 80) return 'High Risk';
  return 'Very Dangerous';
}

// ----------------------------------------------------------------
// Build triggeredRules from feature importances
// ----------------------------------------------------------------
/**
 * Converts feature importances into the `triggeredRules` shape
 * that explanationGenerator.generateReasons() expects.
 *
 * Only features that are actually "fired" (feature value > threshold
 * or the feature importance is high) contribute to the list.
 * The `delta` field carries importance × 100 so frontend
 * progress bars scale naturally (same order of magnitude as old deltas).
 */
function buildTriggeredRules(
  features: URLFeatures,
  importances: Record<string, number>,
): Array<{ ruleId: string; delta: number }> {
  const rules: Array<{ ruleId: string; delta: number }> = [];

  // Feature name → whether it's "active" (bad signal present)
  const activeMap: Record<string, boolean> = {
    hasIpAddress:          features.hasIpAddress,
    hasSuspiciousTld:      features.hasSuspiciousTld,
    brandSimilarity:       (features.brandSimilarity ?? 0) > 0.45,
    entropy:               features.entropy > 3.8,
    hasHttps:              !features.hasHttps,       // active when NO https
    suspiciousWords:       features.suspiciousWords.length > 0,
    isUrlShortener:        features.isUrlShortener,
    urlLength:             features.urlLength > 75,
    numSubdomains:         features.numSubdomains >= 3,
    domainAgeProxy:        (features.domainAgeProxy ?? 0.5) < 0.4,
    hasAtSymbol:           features.hasAtSymbol,
    digitRatio:            (features.digitRatio ?? 0) > 0.2,
    hyphenRatio:           (features.hyphenRatio ?? 0) > 0.25,
    consonantClusterRatio: (features.consonantClusterRatio ?? 0) > 0.2,
    charRepetition:        (features.charRepetition ?? 0) > 0.15,
    numHyphens:            features.numHyphens > 3,
    hasEncodedChars:       features.hasEncodedChars,
    hasDoubleSlash:        features.hasDoubleSlash,
    pathDepth:             (features.pathDepth ?? 0) > 5,
    numQueryParams:        features.numQueryParams > 5,
    numDots:               features.numDots > 4,
  };

  // Good signals (always include, negative delta)
  const goodSignals: Record<string, boolean> = {
    hasHttps:    features.hasHttps,
    no_ip:       !features.hasIpAddress,
    no_tld:      !features.hasSuspiciousTld,
    no_shortener:!features.isUrlShortener,
  };

  for (const [name, isActive] of Object.entries(activeMap)) {
    if (isActive) {
      const imp = importances[name] ?? FEATURE_IMPORTANCES[name] ?? 0.01;
      rules.push({ ruleId: name, delta: Math.round(imp * 100) });
    }
  }

  for (const [name, isGood] of Object.entries(goodSignals)) {
    if (isGood) {
      const imp = importances[name] ?? 0.05;
      rules.push({ ruleId: name, delta: -Math.round(imp * 100) });
    }
  }

  // Sort by absolute delta descending (most impactful first)
  rules.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return rules;
}
