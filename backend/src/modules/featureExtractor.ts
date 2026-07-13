import type { URLFeatures } from '../types';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const SUSPICIOUS_WORDS = [
  'login', 'verify', 'update', 'secure', 'bank', 'wallet',
  'account', 'signin', 'confirm', 'payment', 'gift', 'bonus',
  'crypto', 'free', 'password', 'paypal', 'microsoft', 'apple',
  'amazon', 'netflix', 'support', 'claim', 'prize', 'urgent',
  'suspended', 'limited', 'unusual', 'activity', 'alert',
  'recovery', 'restore', 'reactivate', 'billing', 'invoice',
  'refund', 'security', 'authenticate', 'credentials', 'ebay',
  'google', 'facebook', 'instagram', 'twitter', 'whatsapp',
];

const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
  'short.link', 'rebrand.ly', 'is.gd', 'buff.ly', 'tiny.cc',
  'cutt.ly', 'shorturl.at', 'rb.gy', 'bitly.com', 'bl.ink',
  'shorturl.com', 'snip.ly', 'mcaf.ee', 'youtu.be', 'amzn.to',
  'fb.me', 'dlvr.it', 'ht.ly', 'lnkd.in', 'j.mp',
]);

const SUSPICIOUS_TLDS = new Set([
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top',
  '.click', '.link', '.work', '.party', '.trade', '.review',
  '.science', '.cricket', '.win', '.loan', '.download',
  '.racing', '.accountant', '.webcam', '.zip', '.mov',
  '.buzz', '.rest', '.fun', '.life',
  // Additional high-abuse TLDs (Spamhaus / PhishTank data)
  '.bond', '.sbs', '.cyou', '.icu', '.cfd', '.shop',
  '.online', '.site', '.website', '.monster', '.quest',
  '.vip', '.club', '.bar', '.hair', '.makeup',
]);


/**
 * Known brand tokens for Levenshtein-based typosquatting detection.
 * Inspired by metaheuristic (GWO) feature selection from Onwudebelu et al.
 */
const KNOWN_BRANDS = [
  'paypal', 'google', 'amazon', 'microsoft', 'apple',
  'facebook', 'netflix', 'instagram', 'twitter', 'ebay',
  'linkedin', 'dropbox', 'chase', 'wellsfargo', 'citibank',
  'bankofamerica', 'steam', 'roblox', 'discord', 'reddit',
];

const IPV4_RE = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}([:/?#]|$)/;
const IPV6_RE = /^https?:\/\/\[[0-9a-fA-F:]+\]/;
const ENCODED_RE = /%[0-9a-fA-F]{2}/;

// ----------------------------------------------------------------
// Shannon entropy — high entropy ≈ random / obfuscated string
// ----------------------------------------------------------------
function calcEntropy(s: string): number {
  if (!s) return 0;
  const freq: Record<string, number> = {};
  for (const ch of s) freq[ch] = (freq[ch] ?? 0) + 1;
  return Object.values(freq).reduce((e, cnt) => {
    const p = cnt / s.length;
    return e - p * Math.log2(p);
  }, 0);
}

// ----------------------------------------------------------------
// Count occurrences of a character in a string
// ----------------------------------------------------------------
const count = (s: string, ch: string) => s.split(ch).length - 1;

// ----------------------------------------------------------------
// Levenshtein distance (iterative, O(n·m)) for brand similarity
// ----------------------------------------------------------------
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Compute max brand similarity across all known brands.
 * Returns 0 (no match) → 1 (exact match).
 */
function calcBrandSimilarity(registeredDomain: string): number {
  const base = registeredDomain.replace(/\.[^.]+$/, '').toLowerCase();
  if (!base) return 0;

  let maxSim = 0;
  for (const brand of KNOWN_BRANDS) {
    const dist = levenshtein(base, brand);
    const maxLen = Math.max(base.length, brand.length);
    const sim = 1 - dist / maxLen;
    if (sim > maxSim) maxSim = sim;

    // Substring containment: "paypal-login" contains "paypal" → high sim
    if (base.includes(brand) && brand.length / base.length > 0.5) {
      maxSim = Math.max(maxSim, 0.75);
    }
  }
  return Math.round(maxSim * 1000) / 1000;
}

/**
 * Synthetic domain "age" proxy based on lexical cues.
 * Short, dictionary-looking domains score near 1 (look established).
 * Long, digit-heavy, hyphenated domains score near 0 (look newly coined).
 */
function calcDomainAgeProxy(registeredDomain: string, numHyphens: number, digitRatio: number): number {
  const base = registeredDomain.replace(/\.[^.]+$/, '');
  const len = base.length;
  let score = 1.0;
  if (len > 15) score -= 0.3;
  if (len > 25) score -= 0.2;
  if (numHyphens > 1) score -= 0.2 * numHyphens;
  if (digitRatio > 0.2) score -= 0.3;
  return Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
}

/**
 * Consonant-cluster ratio: fraction of the hostname that is covered by
 * runs of 4+ consecutive consonants — a known DGA indicator.
 */
function calcConsonantClusterRatio(hostname: string): number {
  if (!hostname) return 0;
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  let clusterLen = 0;
  let totalCluster = 0;
  for (const ch of hostname.toLowerCase()) {
    if (consonants.includes(ch)) {
      clusterLen++;
    } else {
      if (clusterLen >= 4) totalCluster += clusterLen;
      clusterLen = 0;
    }
  }
  if (clusterLen >= 4) totalCluster += clusterLen;
  return Math.round((totalCluster / hostname.length) * 1000) / 1000;
}

// ----------------------------------------------------------------
// Main extractor
// ----------------------------------------------------------------
export function extractFeatures(rawUrl: string): URLFeatures {
  // Ensure there's a scheme so URL() can parse it
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = 'http://' + url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Fallback for truly unparseable strings
    return fallback(rawUrl);
  }

  const protocol   = parsed.protocol.replace(':', '');
  const hostname   = parsed.hostname.toLowerCase();
  const pathname   = parsed.pathname;
  const search     = parsed.search;

  // Domain / subdomain / TLD split
  const hostParts  = hostname.split('.');
  const tld        = hostParts.length >= 2 ? '.' + hostParts[hostParts.length - 1] : '';
  const domain     = hostParts.length >= 2
    ? hostParts[hostParts.length - 2] + tld
    : hostname;
  const subdomain  = hostParts.length > 2
    ? hostParts.slice(0, hostParts.length - 2).join('.')
    : '';
  const numSubdomains = subdomain ? subdomain.split('.').length : 0;

  // Basic counts
  const urlLower         = url.toLowerCase();
  const urlLength        = url.length;
  const domainLength     = domain.length;
  const numDots          = count(hostname, '.');
  const numSlashes       = count(pathname, '/');
  const numHyphens       = count(url, '-');
  const numUnderscores   = count(url, '_');
  const numDigits        = (url.match(/\d/g) ?? []).length;
  const numSpecialChars  = (url.match(/[!@#$%^&*()=+[\]{}'";<>?\\|`~]/g) ?? []).length;
  const numQueryParams   = search
    ? search.replace('?', '').split('&').filter(Boolean).length
    : 0;

  // Boolean signals
  const hasHttps         = protocol === 'https';
  const hasHttp          = protocol === 'http';
  const hasIpAddress     = IPV4_RE.test(url) || IPV6_RE.test(url);
  const hasSuspiciousTld = SUSPICIOUS_TLDS.has(tld);
  const isUrlShortener   = URL_SHORTENERS.has(hostname);
  const hasAtSymbol      = url.includes('@');
  const hasDoubleSlash   = /\/\/(?!$)/.test(pathname);
  const hasEncodedChars  = ENCODED_RE.test(url);

  // Suspicious keywords in URL (whole lowercase URL)
  const suspiciousWords  = SUSPICIOUS_WORDS.filter(w =>
    urlLower.includes(w)
  );

  // Entropy of the hostname (more meaningful than full URL)
  const entropy = calcEntropy(hostname);

  // ── Domain Metrics (GWO / Metaheuristic-optimised) ─────────────────────
  const digitRatio            = urlLength > 0 ? numDigits / urlLength : 0;
  const hyphenRatio           = domainLength > 0 ? numHyphens / domainLength : 0;
  const pathDepth             = pathname.split('/').filter(Boolean).length;
  const brandSimilarity       = calcBrandSimilarity(domain);
  const domainAgeProxy        = calcDomainAgeProxy(domain, numHyphens, digitRatio);
  const charRepetition        = calcCharRepetition(hostname, hostname.length);
  const consonantClusterRatio = calcConsonantClusterRatio(hostname);

  const features: URLFeatures = {
    urlLength, domainLength, numDots, numSlashes, numHyphens,
    numUnderscores, numDigits, numSpecialChars, numQueryParams,
    numSubdomains, hasHttps, hasHttp, hasIpAddress,
    hasSuspiciousTld, isUrlShortener, hasAtSymbol,
    hasDoubleSlash, hasEncodedChars, entropy, suspiciousWords,
    protocol, domain, subdomain, path: pathname, tld,
    queryString: search,
    // Extended domain metrics
    digitRatio, hyphenRatio, pathDepth, brandSimilarity,
    domainAgeProxy, charRepetition, consonantClusterRatio,
  };

  // Attach the normalised feature vector for the ML classifier
  features.featureVector = toFeatureVector(features);

  return features;
}

// ----------------------------------------------------------------
// Max character repetition (normalised)
// ----------------------------------------------------------------
function calcCharRepetition(s: string, len: number): number {
  if (!s || len === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < s.length; i++) {
    cur = s[i] === s[i - 1] ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return Math.round((max / len) * 1000) / 1000;
}

// ----------------------------------------------------------------
// Normalise a single value into [0, 1] using a soft sigmoid-like cap
// ----------------------------------------------------------------
function norm(val: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

// ----------------------------------------------------------------
// toFeatureVector — fixed-length [0, 1] feature tensor
// ----------------------------------------------------------------
/**
 * Converts a URLFeatures object into a normalised numeric vector
 * suitable for direct ML model input.
 *
 * Feature order is fixed and documented — any future real model
 * (e.g., ONNX) must match this exact ordering.
 *
 * Index → Feature:
 *  0  urlLength       (normalised 0–300)
 *  1  domainLength    (normalised 0–64)
 *  2  numDots         (normalised 0–10)
 *  3  numHyphens      (normalised 0–10)
 *  4  numUnderscores  (normalised 0–10)
 *  5  numDigits       (normalised 0–30)
 *  6  numSpecialChars (normalised 0–15)
 *  7  numQueryParams  (normalised 0–10)
 *  8  numSubdomains   (normalised 0–5)
 *  9  hasHttps        (0 or 1)
 *  10 hasIpAddress    (0 or 1)
 *  11 hasSuspiciousTld(0 or 1)
 *  12 isUrlShortener  (0 or 1)
 *  13 hasAtSymbol     (0 or 1)
 *  14 hasDoubleSlash  (0 or 1)
 *  15 hasEncodedChars (0 or 1)
 *  16 entropy         (normalised 0–5)
 *  17 suspiciousWordCount (normalised 0–10)
 *  18 digitRatio      (already 0–1)
 *  19 hyphenRatio     (already 0–1)
 *  20 pathDepth       (normalised 0–10)
 *  21 brandSimilarity (already 0–1)
 *  22 domainAgeProxy  (already 0–1, inverted → high age = low risk)
 *  23 charRepetition  (already 0–1)
 *  24 consonantClusterRatio (already 0–1)
 *  25 numSlashes      (normalised 0–10)
 */
export function toFeatureVector(f: URLFeatures): number[] {
  return [
    norm(f.urlLength,       0,  300),
    norm(f.domainLength,    0,   64),
    norm(f.numDots,         0,   10),
    norm(f.numHyphens,      0,   10),
    norm(f.numUnderscores,  0,   10),
    norm(f.numDigits,       0,   30),
    norm(f.numSpecialChars, 0,   15),
    norm(f.numQueryParams,  0,   10),
    norm(f.numSubdomains,   0,    5),
    f.hasHttps         ? 0 : 1,   // inverted: no HTTPS → high risk
    f.hasIpAddress     ? 1 : 0,
    f.hasSuspiciousTld ? 1 : 0,
    f.isUrlShortener   ? 1 : 0,
    f.hasAtSymbol      ? 1 : 0,
    f.hasDoubleSlash   ? 1 : 0,
    f.hasEncodedChars  ? 1 : 0,
    norm(f.entropy,         0,    5),
    norm(f.suspiciousWords.length, 0, 10),
    f.digitRatio            ?? norm(f.numDigits, 0, Math.max(f.urlLength, 1)),
    f.hyphenRatio           ?? 0,
    norm(f.pathDepth        ?? 0,  0, 10),
    f.brandSimilarity       ?? 0,
    1 - (f.domainAgeProxy   ?? 0.5),  // invert: lower age proxy → higher risk
    f.charRepetition        ?? 0,
    f.consonantClusterRatio ?? 0,
    norm(f.numSlashes,      0,   10),
  ];
}

// ----------------------------------------------------------------
// Fallback when URL parsing fails completely
// ----------------------------------------------------------------
function fallback(raw: string): URLFeatures {
  const base: URLFeatures = {
    urlLength: raw.length, domainLength: 0, numDots: count(raw, '.'),
    numSlashes: count(raw, '/'), numHyphens: count(raw, '-'),
    numUnderscores: count(raw, '_'),
    numDigits: (raw.match(/\d/g) ?? []).length,
    numSpecialChars: 0, numQueryParams: 0, numSubdomains: 0,
    hasHttps: false, hasHttp: false, hasIpAddress: false,
    hasSuspiciousTld: false, isUrlShortener: false,
    hasAtSymbol: raw.includes('@'), hasDoubleSlash: false,
    hasEncodedChars: false, entropy: calcEntropy(raw),
    suspiciousWords: [], protocol: '', domain: raw,
    subdomain: '', path: '', tld: '', queryString: '',
    // Extended domain metrics
    digitRatio: 0, hyphenRatio: 0, pathDepth: 0,
    brandSimilarity: 0, domainAgeProxy: 0.5,
    charRepetition: 0, consonantClusterRatio: 0,
  };
  base.featureVector = toFeatureVector(base);
  return base;
}
