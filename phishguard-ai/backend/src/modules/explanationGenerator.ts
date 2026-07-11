import type { URLFeatures, AnalysisReason, Severity } from '../types';
import { RULES } from './riskCalculator';

// ----------------------------------------------------------------
// Feature metadata for ML-driven explanations
// Maps feature names (from featureImportances) to human-readable
// labels and descriptions used in the UI.
// ----------------------------------------------------------------

interface FeatureMeta {
  label:       string;
  description: (f: URLFeatures, importance: number) => string;
  positive:    (f: URLFeatures) => boolean;  // true = good signal
  severity:    (f: URLFeatures, importance: number) => Severity;
}

const FEATURE_META: Record<string, FeatureMeta> = {
  hasIpAddress: {
    label: 'IP address used instead of domain',
    description: (f, imp) =>
      `Raw IP address in URL — contributed ${pct(imp)} to the ML model's phishing classification. `
      + 'Legitimate websites almost always use registered domain names.',
    positive: f => !f.hasIpAddress,
    severity: (f, imp) => f.hasIpAddress ? (imp > 0.1 ? 'critical' : 'danger') : 'safe',
  },
  hasSuspiciousTld: {
    label: 'Suspicious top-level domain (TLD)',
    description: (f, imp) =>
      `The TLD "${f.tld}" is associated with high phishing rates — the model weighted this at ${pct(imp)} importance. `
      + 'Attackers register cheap, unrestricted TLDs to deploy phishing pages quickly.',
    positive: f => !f.hasSuspiciousTld,
    severity: (f, imp) => f.hasSuspiciousTld ? (imp > 0.09 ? 'critical' : 'danger') : 'safe',
  },
  brandSimilarity: {
    label: 'Brand impersonation detected',
    description: (f, imp) =>
      `The domain "${f.domain}" is lexically similar to a known brand — `
      + `similarity score contributed ${pct(imp)} to phishing probability. `
      + 'Typosquatting uses subtle misspellings to deceive users.',
    positive: f => (f.brandSimilarity ?? 0) < 0.45,
    severity: (f, imp) => (f.brandSimilarity ?? 0) > 0.6 ? 'critical'
              : (f.brandSimilarity ?? 0) > 0.45 ? 'danger' : 'info',
  },
  entropy: {
    label: 'High domain entropy (likely DGA)',
    description: (f, imp) =>
      `Domain entropy is ${f.entropy.toFixed(2)} bits — the model assigned ${pct(imp)} importance to this. `
      + 'High entropy suggests an algorithmically generated domain (DGA), common in phishing infrastructure.',
    positive: f => f.entropy <= 3.8,
    severity: (f) => f.entropy > 4.2 ? 'critical' : f.entropy > 3.8 ? 'danger' : 'info',
  },
  hasHttps: {
    label: 'No HTTPS encryption',
    description: (f, imp) =>
      f.hasHttps
        ? `The site uses HTTPS — a positive signal with ${pct(imp)} model weight.`
        : `Missing HTTPS — the model flagged this at ${pct(imp)} importance. `
          + 'Unencrypted HTTP allows attackers to intercept credentials in transit.',
    positive: f => f.hasHttps,
    severity: (f) => f.hasHttps ? 'safe' : 'danger',
  },
  suspiciousWords: {
    label: 'Suspicious keywords detected',
    description: (f, imp) => {
      const shown = f.suspiciousWords.slice(0, 4).map(w => `"${w}"`).join(', ');
      const extra = f.suspiciousWords.length > 4 ? ` (+${f.suspiciousWords.length - 4} more)` : '';
      return `Keywords ${shown}${extra} were detected — contributing ${pct(imp)} to the classification. `
           + 'Phishing pages use trust-inducing words to impersonate legitimate services.';
    },
    positive: f => f.suspiciousWords.length === 0,
    severity: (f, imp) => imp > 0.06 ? 'danger' : 'warning',
  },
  isUrlShortener: {
    label: 'URL shortening service',
    description: (f, imp) =>
      `Routed through a URL shortener — model weight ${pct(imp)}. `
      + 'Short URLs mask the real destination, making it impossible to judge safety at a glance.',
    positive: f => !f.isUrlShortener,
    severity: (f, imp) => f.isUrlShortener ? (imp > 0.05 ? 'danger' : 'warning') : 'safe',
  },
  urlLength: {
    label: 'Abnormal URL length',
    description: (f, imp) =>
      `URL length is ${f.urlLength} characters — the model weighted this at ${pct(imp)}. `
      + (f.urlLength > 120 ? 'Extremely long URLs often encode payloads or obscure the true domain.'
        : f.urlLength > 75 ? 'Long URLs are sometimes used to hide the destination.'
        : 'URL length is within a normal range.'),
    positive: f => f.urlLength <= 75,
    severity: (f) => f.urlLength > 120 ? 'danger' : f.urlLength > 75 ? 'warning' : 'safe',
  },
  numSubdomains: {
    label: 'Excessive subdomain nesting',
    description: (f, imp) =>
      `${f.numSubdomains} subdomain level(s) detected — model importance ${pct(imp)}. `
      + 'Attackers use deep subdomain chains (e.g., paypal.login.evil.com) to mislead users.',
    positive: f => f.numSubdomains <= 1,
    severity: (f) => f.numSubdomains >= 3 ? 'danger' : f.numSubdomains === 2 ? 'warning' : 'safe',
  },
  domainAgeProxy: {
    label: 'Newly coined domain (lexical age signal)',
    description: (f, imp) =>
      `Domain lexical age proxy scored ${((f.domainAgeProxy ?? 0.5) * 100).toFixed(0)}% — `
      + `model weight ${pct(imp)}. `
      + 'Freshly-coined-looking domains with random strings are strongly correlated with phishing campaigns.',
    positive: f => (f.domainAgeProxy ?? 0.5) >= 0.6,
    severity: (f) => (f.domainAgeProxy ?? 0.5) < 0.3 ? 'danger'
              : (f.domainAgeProxy ?? 0.5) < 0.5 ? 'warning' : 'safe',
  },
  hasAtSymbol: {
    label: '@ symbol in URL',
    description: (f, imp) =>
      `@ symbol present — model weight ${pct(imp)}. `
      + 'Browsers treat text before @ as authentication credentials, effectively hiding the real destination domain.',
    positive: f => !f.hasAtSymbol,
    severity: (f, imp) => f.hasAtSymbol ? (imp > 0.03 ? 'critical' : 'danger') : 'safe',
  },
  digitRatio: {
    label: 'High digit density in URL',
    description: (f, imp) =>
      `${((f.digitRatio ?? 0) * 100).toFixed(1)}% of the URL consists of digits — model importance ${pct(imp)}. `
      + 'Phishing URLs often contain numeric codes or obfuscated IP addresses embedded as decimal numbers.',
    positive: f => (f.digitRatio ?? 0) < 0.15,
    severity: (f) => (f.digitRatio ?? 0) > 0.3 ? 'warning' : 'info',
  },
  hyphenRatio: {
    label: 'Hyphen-heavy domain',
    description: (f, imp) =>
      `Hyphen density in domain: ${((f.hyphenRatio ?? 0) * 100).toFixed(1)}% — model weight ${pct(imp)}. `
      + 'Hyphens are used in typosquatting patterns like "paypal-secure-login.com".',
    positive: f => (f.hyphenRatio ?? 0) < 0.2,
    severity: (f) => (f.hyphenRatio ?? 0) > 0.35 ? 'warning' : 'info',
  },
  consonantClusterRatio: {
    label: 'DGA-like consonant clustering',
    description: (f, imp) =>
      `Consonant cluster ratio: ${((f.consonantClusterRatio ?? 0) * 100).toFixed(1)}% — model importance ${pct(imp)}. `
      + 'Long consonant runs (e.g., "xkbqrtm") are a hallmark of Domain Generation Algorithm (DGA) domains.',
    positive: f => (f.consonantClusterRatio ?? 0) < 0.15,
    severity: (f) => (f.consonantClusterRatio ?? 0) > 0.25 ? 'warning' : 'info',
  },
  charRepetition: {
    label: 'Suspicious character repetition',
    description: (f, imp) =>
      `Character repetition score: ${((f.charRepetition ?? 0) * 100).toFixed(1)}% — model weight ${pct(imp)}. `
      + 'Repeated characters in domain names are an obfuscation tactic.',
    positive: f => (f.charRepetition ?? 0) < 0.1,
    severity: () => 'info',
  },
  numHyphens: {
    label: 'Excessive hyphens',
    description: (f, imp) =>
      `${f.numHyphens} hyphens found — model importance ${pct(imp)}. `
      + 'Attackers insert hyphens to mimic brand names while registering different domains.',
    positive: f => f.numHyphens <= 2,
    severity: (f) => f.numHyphens > 4 ? 'warning' : 'info',
  },
  hasEncodedChars: {
    label: 'Percent-encoded characters',
    description: (f, imp) =>
      `URL contains percent-encoded characters — model weight ${pct(imp)}. `
      + 'Encoding can be used to bypass URL filters or hide malicious path segments.',
    positive: f => !f.hasEncodedChars,
    severity: (f) => f.hasEncodedChars ? 'warning' : 'safe',
  },
  hasDoubleSlash: {
    label: 'Double-slash redirect pattern',
    description: (f, imp) =>
      `Double-slash (//) found in path — model weight ${pct(imp)}. `
      + 'This pattern can be used to redirect users to an attacker-controlled domain.',
    positive: f => !f.hasDoubleSlash,
    severity: (f) => f.hasDoubleSlash ? 'warning' : 'safe',
  },
  pathDepth: {
    label: 'Deep URL path structure',
    description: (f, imp) =>
      `Path depth: ${f.pathDepth ?? 0} levels — model importance ${pct(imp)}. `
      + 'Deeply nested paths can be used to obscure the true resource or evade automated scanners.',
    positive: f => (f.pathDepth ?? 0) <= 4,
    severity: (f) => (f.pathDepth ?? 0) > 6 ? 'warning' : 'info',
  },
  numQueryParams: {
    label: 'Many query parameters',
    description: (f, imp) =>
      `${f.numQueryParams} query parameters — model weight ${pct(imp)}. `
      + 'Phishing pages use excessive parameters for tracking victims and obfuscating destinations.',
    positive: f => f.numQueryParams <= 4,
    severity: (f) => f.numQueryParams > 6 ? 'warning' : 'info',
  },
  numDots: {
    label: 'Excessive dots in hostname',
    description: (f, imp) =>
      `${f.numDots} dots in hostname — model importance ${pct(imp)}. `
      + 'Many dots indicate deep subdomain nesting, a technique used to embed trusted brand names.',
    positive: f => f.numDots <= 3,
    severity: (f) => f.numDots > 5 ? 'warning' : 'info',
  },
};

// ----------------------------------------------------------------
// Helper
// ----------------------------------------------------------------
function pct(importance: number): string {
  return `${(importance * 100).toFixed(1)}%`;
}

// ----------------------------------------------------------------
// generateReasons — ML feature-importance-driven explanations
// ----------------------------------------------------------------
/**
 * Generates AnalysisReason[] items. When featureImportances is provided
 * (from the ML ensemble), reasons are ordered and described by feature
 * importance contribution. Falls back to rule-based logic if absent.
 */
export function generateReasons(
  features:           URLFeatures,
  triggeredRules:     Array<{ ruleId: string; delta: number }>,
  featureImportances?: Record<string, number>,
): AnalysisReason[] {
  // ── ML-driven path ────────────────────────────────────────────
  if (featureImportances && Object.keys(featureImportances).length > 0) {
    return generateMLReasons(features, featureImportances);
  }

  // ── Legacy fallback (rule-based) ──────────────────────────────
  return generateRuleReasons(features, triggeredRules);
}

// ----------------------------------------------------------------
// ML-driven explanation builder
// ----------------------------------------------------------------
function generateMLReasons(
  features:   URLFeatures,
  importances: Record<string, number>,
): AnalysisReason[] {
  const reasons: AnalysisReason[] = [];

  // Sort features by importance descending
  const sorted = Object.entries(importances)
    .sort(([, a], [, b]) => b - a);

  for (const [featureName, importance] of sorted) {
    const meta = FEATURE_META[featureName];
    if (!meta) continue;

    // Skip features with negligible importance (< 1%)
    if (importance < 0.01) continue;

    const isPositive = meta.positive(features);
    const severity   = meta.severity(features, importance);

    // Only include "good signal" reasons if they are actually positive
    // (i.e., the feature has a safe value). Always include bad signals.
    if (isPositive && importance < 0.06) continue;

    reasons.push({
      id:          featureName,
      label:       meta.label,
      description: meta.description(features, importance),
      severity,
      positive:    isPositive,
      score_delta: isPositive
        ? -Math.round(importance * 100)   // good signal → negative delta (reduces risk)
        : Math.round(importance * 100),   // bad signal  → positive delta (increases risk)

    });
  }

  // Always append contextual info reasons
  reasons.push(...buildContextReasons(features));

  // Sort: bad signals first, then good, by absolute importance
  reasons.sort((a, b) => {
    if (a.positive !== b.positive) return a.positive ? 1 : -1;
    return Math.abs(b.score_delta) - Math.abs(a.score_delta);
  });

  return reasons;
}

// ----------------------------------------------------------------
// Legacy rule-based explanation builder (fallback)
// ----------------------------------------------------------------
function generateRuleReasons(
  features:       URLFeatures,
  triggeredRules: Array<{ ruleId: string; delta: number }>,
): AnalysisReason[] {
  const triggeredIds = new Set(triggeredRules.map(r => r.ruleId));
  const deltaMap     = new Map(triggeredRules.map(r => [r.ruleId, r.delta]));
  const reasons: AnalysisReason[] = [];

  for (const rule of RULES) {
    if (rule.id === 'suspicious_words') continue;

    const triggered = triggeredIds.has(rule.id);
    if (!triggered) continue;

    const delta    = deltaMap.get(rule.id) ?? rule.delta;
    const severity = severityFromDelta(delta, rule.positive);

    reasons.push({
      id:          rule.id,
      label:       rule.label,
      description: rule.description,
      severity,
      positive:    rule.positive,
      score_delta: delta,
    });
  }

  if (features.suspiciousWords.length > 0) {
    const words  = features.suspiciousWords.slice(0, 4);
    const delta  = deltaMap.get('suspicious_words') ?? 0;
    const shown  = words.join(', ');
    const extra  = features.suspiciousWords.length > 4
      ? ` (+${features.suspiciousWords.length - 4} more)`
      : '';

    reasons.push({
      id:          'suspicious_words',
      label:       `Suspicious keyword${words.length > 1 ? 's' : ''}: ${shown}${extra}`,
      description: `The URL contains keywords commonly found in phishing pages: "${features.suspiciousWords.join('", "')}". Attackers use these to impersonate trusted services.`,
      severity:    delta >= 20 ? 'critical' : 'warning',
      positive:    false,
      score_delta: delta,
    });
  }

  reasons.push(...buildContextReasons(features));

  reasons.sort((a, b) => {
    if (a.positive !== b.positive) return a.positive ? 1 : -1;
    return Math.abs(b.score_delta) - Math.abs(a.score_delta);
  });

  return reasons;
}

// ----------------------------------------------------------------
// Context reasons (always shown, informational)
// ----------------------------------------------------------------
function buildContextReasons(f: URLFeatures): AnalysisReason[] {
  const out: AnalysisReason[] = [];

  out.push({
    id:          'url_length_info',
    label:       `URL length: ${f.urlLength} characters`,
    description: f.urlLength <= 54
      ? 'URL length is normal.'
      : f.urlLength <= 75
      ? 'URL is slightly long but within acceptable range.'
      : 'Long URL — may be used for obfuscation.',
    severity:    f.urlLength <= 75 ? 'info' : 'warning',
    positive:    f.urlLength <= 75,
    score_delta: 0,
  });

  out.push({
    id:          'protocol_info',
    label:       `Protocol: ${f.protocol.toUpperCase()}`,
    description: f.hasHttps
      ? 'HTTPS encrypts data in transit between your browser and the server.'
      : 'HTTP is unencrypted. Avoid entering passwords on HTTP sites.',
    severity:    f.hasHttps ? 'safe' : 'warning',
    positive:    f.hasHttps,
    score_delta: 0,
  });

  if (f.entropy > 2.5) {
    out.push({
      id:          'entropy_info',
      label:       `Domain entropy: ${f.entropy.toFixed(2)}`,
      description: f.entropy > 3.8
        ? 'High entropy suggests the domain may be algorithmically generated (DGA domain).'
        : 'Domain entropy is within a normal range.',
      severity:    f.entropy > 3.8 ? 'warning' : 'info',
      positive:    f.entropy <= 3.8,
      score_delta: 0,
    });
  }

  return out;
}

// ----------------------------------------------------------------
// Map score delta → severity label (legacy fallback)
// ----------------------------------------------------------------
function severityFromDelta(delta: number, positive: boolean): Severity {
  if (positive) return 'safe';
  if (delta >= 30) return 'critical';
  if (delta >= 15) return 'danger';
  if (delta >= 8)  return 'warning';
  return 'info';
}

// ----------------------------------------------------------------
// Generate recommendation text based on classification
// ----------------------------------------------------------------
export function generateRecommendation(classification: string): string {
  switch (classification) {
    case 'safe':
      return 'This website appears safe based on URL analysis. Always verify sensitive information before entering credentials. No security tool can guarantee 100% safety.';
    case 'suspicious':
      return 'Proceed with caution. Verify the domain matches the official website before logging in. Look for subtle spelling differences (e.g., "paypa1.com"). Do not enter passwords or financial information if in doubt.';
    case 'phishing':
      return 'HIGH RISK: This URL shows strong phishing indicators. Do NOT enter passwords, payment details, or personal information. Close the tab immediately. If you received this link via email or SMS, report it as phishing.';
    default:
      return 'Analysis complete. Review the details below and exercise caution.';
  }
}
