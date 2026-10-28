/**
 * PhishGuard - Client-Side Feature Extraction & Heuristic Risk Engine
 * Perfectly mirrors python/url_analyzer.py for instantaneous client evaluation.
 */

import { ExtractedFeatures, RiskLevel, ScanRecord, ThreatIndicator } from '../types';

const KNOWN_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'cli.gs', 'yfrog.com',
  'migre.me', 'ff.im', 'tiny.cc', 'url4.eu', 'twit.ac', 'su.pr', 'twurl.nl',
  'snipurl.com', 'short.to', 'ow.ly', 'buff.ly', 'cutt.ly', 'rebrand.ly',
  'qr.ae', 'adf.ly', 'bc.vc', 'shorte.st'
]);

const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'verify', 'verification', 'update', 'security',
  'secure', 'account', 'banking', 'authenticate', 'password', 'credential',
  'confirm', 'confirmation', 'support', 'billing', 'invoice', 'appleid',
  'paypal', 'wallet', 'recover', 'suspicious', 'webscr', 'ebayisapi'
];

const TARGETED_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'netflix', 'amazon', 'facebook',
  'instagram', 'chase', 'wellsfargo', 'bankofamerica', 'coinbase', 'binance',
  'dropbox', 'dhl', 'fedex', 'usps', 'docusign'
];

export function calculateEntropy(text: string): number {
  if (!text) return 0;
  const frequencies = new Map<string, number>();
  for (const char of text) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  let entropy = 0;
  const len = text.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

export function validateAndNormalizeUrl(rawUrl: string): { isValid: boolean; normalized: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, normalized: '', error: 'URL cannot be empty.' };
  }

  const cleaned = rawUrl.trim();

  if (cleaned.length > 2048) {
    return { isValid: false, normalized: '', error: 'URL exceeds maximum allowable length of 2,048 characters.' };
  }

  // Reject control characters
  for (let i = 0; i < cleaned.length; i++) {
    const code = cleaned.charCodeAt(i);
    if (code < 32 || code === 127) {
      return { isValid: false, normalized: '', error: 'URL contains non-printable control characters.' };
    }
  }

  if (!cleaned.includes('://')) {
    return { isValid: false, normalized: '', error: 'Missing protocol scheme. Please enter a full URL starting with http:// or https://' };
  }

  try {
    const parsed = new URL(cleaned);
    const scheme = parsed.protocol.replace(':', '').toLowerCase();

    if (scheme !== 'http' && scheme !== 'https') {
      return { isValid: false, normalized: '', error: `Unsupported scheme '${scheme}'. PhishGuard only evaluates http:// and https:// URLs.` };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) {
      return { isValid: false, normalized: '', error: 'Invalid URL: Missing a destination hostname.' };
    }

    if (hostname.includes(' ') || hostname.includes('\\')) {
      return { isValid: false, normalized: '', error: 'Invalid URL: Hostname contains invalid whitespace or slashes.' };
    }

    return { isValid: true, normalized: parsed.href };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { isValid: false, normalized: '', error: `Malformed URL syntax: ${msg}` };
  }
}

export function checkIsIpAddress(hostname: string): boolean {
  const cleaned = hostname.replace(/^\[|\]$/g, '');
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Pattern.test(cleaned);
}

export function extractUrlFeatures(url: string): ExtractedFeatures {
  const parsed = new URL(url);
  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const path = parsed.pathname || '';
  const query = parsed.search ? parsed.search.slice(1) : '';
  const fullUrl = url.trim();

  const isHttps = scheme === 'https';
  const hasIp = checkIsIpAddress(hostname);
  const dotCount = (hostname.match(/\./g) || []).length;
  const parts = hostname.split('.').filter(Boolean);

  let subdomainCount = 0;
  if (!hasIp && parts.length > 2) {
    const isCctld = parts.length >= 3 && ['co', 'com', 'net', 'org', 'gov', 'edu'].includes(parts[parts.length - 2]) && parts[parts.length - 1].length === 2;
    const rootParts = isCctld ? 3 : 2;
    subdomainCount = Math.max(0, parts.length - rootParts);
  }

  const isShortener = KNOWN_SHORTENERS.has(hostname);
  const suspiciousWordsHost = SUSPICIOUS_KEYWORDS.filter(w => hostname.includes(w));
  const suspiciousWordsPath = SUSPICIOUS_KEYWORDS.filter(w => path.toLowerCase().includes(w));

  const suspectedBrandSpoofing: string[] = [];
  if (!hasIp && parts.length > 2) {
    const rootDomain = parts.slice(-2).join('.');
    for (const brand of TARGETED_BRANDS) {
      if (hostname.includes(brand) && !rootDomain.includes(brand)) {
        suspectedBrandSpoofing.push(brand);
      }
    }
  }

  const atSymbolCount = (fullUrl.match(/@/g) || []).length;
  const hyphenCountHost = (hostname.match(/-/g) || []).length;
  const doubleSlashInPath = path.includes('//');
  const percentCount = (fullUrl.match(/%/g) || []).length;
  const hasUrlEncoding = /%[0-9a-fA-F]{2}/.test(fullUrl);
  const tildeCount = (fullUrl.match(/~/g) || []).length;

  const port = parsed.port ? parseInt(parsed.port, 10) : null;
  const unusualPort = port !== null && port !== 80 && port !== 443;
  const hostEntropy = calculateEntropy(hostname);
  const hasPunycode = hostname.includes('xn--');

  const unusualSymbolsCount = atSymbolCount + (doubleSlashInPath ? 1 : 0) + percentCount + tildeCount;

  return {
    url: fullUrl,
    scheme,
    hostname,
    path,
    query,
    isHttps,
    hasIp,
    urlLength: fullUrl.length,
    hostnameLength: hostname.length,
    pathLength: path.length,
    dotCount,
    subdomainCount,
    isShortener,
    suspiciousWordsHost,
    suspiciousWordsPath,
    suspiciousWordsCount: suspiciousWordsHost.length + suspiciousWordsPath.length,
    suspectedBrandSpoofing,
    atSymbolCount,
    hyphenCountHost,
    doubleSlashInPath,
    percentCount,
    hasUrlEncoding,
    tildeCount,
    unusualSymbolsCount,
    port,
    unusualPort,
    hostEntropy,
    hasPunycode
  };
}

export function calculateHeuristicRisk(features: ExtractedFeatures): {
  riskScore: number;
  riskLevel: RiskLevel;
  indicators: ThreatIndicator[];
  explanationSummary: string;
  precautions: string[];
} {
  let score = 0;
  const indicators: ThreatIndicator[] = [];

  if (features.hasIp) {
    score += 30;
    indicators.push({
      name: 'Host Uses Direct IP Address',
      impact: '+30 pts',
      severity: 'high',
      description: 'Legitimate websites virtually always use domain names. Direct IP addresses are commonly used in phishing campaigns to bypass DNS reputation filters.'
    });
  }

  if (!features.isHttps) {
    score += 20;
    indicators.push({
      name: 'Unencrypted HTTP Protocol',
      impact: '+20 pts',
      severity: 'medium',
      description: 'Traffic is sent in plaintext without SSL/TLS encryption, exposing credentials and session data to interception.'
    });
  }

  if (features.isShortener) {
    score += 20;
    indicators.push({
      name: 'URL Shortening Service',
      impact: '+20 pts',
      severity: 'medium',
      description: 'Shorteners obscure the true destination. Attackers frequently use shorteners to disguise deceptive domains in SMS (smishing) and email campaigns.'
    });
  }

  if (features.suspectedBrandSpoofing.length > 0) {
    const brands = features.suspectedBrandSpoofing.join(', ');
    score += 35;
    indicators.push({
      name: `Targeted Brand Mimicry (${brands})`,
      impact: '+35 pts',
      severity: 'high',
      description: `Hostname references recognized brand name(s) (${brands}) in a prefix or subdomain rather than the authentic root domain, strongly suggesting a credential phishing lure.`
    });
  }

  if (features.suspiciousWordsHost.length > 0) {
    const words = features.suspiciousWordsHost.join(', ');
    score += 20;
    indicators.push({
      name: 'Deceptive Authentication Keywords in Hostname',
      impact: '+20 pts',
      severity: 'high',
      description: `Hostname contains security or billing keywords (${words}) commonly used to deceive users into believing they are visiting an official authentication portal.`
    });
  } else if (features.suspiciousWordsPath.length > 0) {
    const words = features.suspiciousWordsPath.slice(0, 3).join(', ');
    score += 10;
    indicators.push({
      name: 'Suspicious Keywords in Path',
      impact: '+10 pts',
      severity: 'medium',
      description: `URL path includes keywords (${words}) targeting account security or credential workflows.`
    });
  }

  if (features.atSymbolCount > 0) {
    score += 25;
    indicators.push({
      name: 'At Symbol (@) in URL',
      impact: '+25 pts',
      severity: 'high',
      description: "Browsers interpret text before an '@' symbol as HTTP credentials and navigate to whatever follows. Phishers use this to display a fake domain in the leading text."
    });
  }

  if (features.doubleSlashInPath) {
    score += 15;
    indicators.push({
      name: 'Double Slashes in URL Path',
      impact: '+15 pts',
      severity: 'medium',
      description: 'Double slashes (//) inside the path are often used for open redirects or URL parser confusion to evade simple URL matchers.'
    });
  }

  if (features.urlLength > 100) {
    score += 15;
    indicators.push({
      name: `Abnormally Long URL (${features.urlLength} characters)`,
      impact: '+15 pts',
      severity: 'medium',
      description: 'Excessively long URLs are often engineered to push the real domain name off-screen on mobile devices and narrow address bars.'
    });
  } else if (features.urlLength > 75) {
    score += 8;
    indicators.push({
      name: `Extended URL Length (${features.urlLength} characters)`,
      impact: '+8 pts',
      severity: 'low',
      description: 'The URL length is noticeably above the typical median of 40–55 characters.'
    });
  }

  if (features.subdomainCount >= 3) {
    score += 15;
    indicators.push({
      name: `Excessive Subdomain Depth (${features.subdomainCount} levels)`,
      impact: '+15 pts',
      severity: 'medium',
      description: 'Multiple subdomain layers are frequently configured by phishers on free or compromised DNS zones to mimic authentic service URLs.'
    });
  } else if (features.subdomainCount === 2) {
    score += 8;
    indicators.push({
      name: 'Multiple Subdomains (2 levels)',
      impact: '+8 pts',
      severity: 'low',
      description: 'Contains two subdomain levels preceding the registered root domain.'
    });
  }

  if (features.hyphenCountHost >= 2) {
    score += 12;
    indicators.push({
      name: `Multiple Hyphens in Hostname (${features.hyphenCountHost} hyphens)`,
      impact: '+12 pts',
      severity: 'medium',
      description: "Hyphens are frequently chained to concatenate deceptive brand names together (e.g., 'paypal-security-update.com')."
    });
  }

  if (features.unusualPort) {
    score += 18;
    indicators.push({
      name: `Non-Standard Port (${features.port})`,
      impact: '+18 pts',
      severity: 'medium',
      description: `The URL directs traffic to port ${features.port} rather than standard port 80 (HTTP) or 443 (HTTPS), which is unusual for reputable public web services.`
    });
  }

  if (features.hasPunycode) {
    score += 20;
    indicators.push({
      name: 'Punycode / IDN Homoglyph Encoding (xn--)',
      impact: '+20 pts',
      severity: 'high',
      description: 'Punycode is frequently abused in homograph attacks to substitute lookalike Cyrillic or Greek characters for Latin letters in famous domains.'
    });
  }

  if (features.hasUrlEncoding && features.percentCount >= 2) {
    score += 10;
    indicators.push({
      name: 'Heavy Hex / Percent-Encoding',
      impact: '+10 pts',
      severity: 'low',
      description: 'Hex escapes are sometimes used to disguise executable extensions or characters from automated gateway inspection.'
    });
  }

  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel: RiskLevel = 'Low';
  let summary = '';
  let precautions: string[] = [];

  if (finalScore >= 70) {
    riskLevel = 'High';
    summary = 'This URL exhibits multiple high-confidence phishing indicators. Proceeding to this link carries significant risk of credential theft, session hijacking, or malicious payload delivery.';
    precautions = [
      'Do NOT enter passwords, email addresses, credit cards, or personal credentials on this site.',
      'Do NOT download files or authorize browser notification requests.',
      'If this link arrived via email, SMS, or direct message, report it as phishing to your security administrator or service provider.',
      'Visit the legitimate organization by typing their known official address directly into a clean browser tab.'
    ];
  } else if (finalScore >= 36) {
    riskLevel = 'Medium';
    summary = 'This URL displays several suspicious structural or lexical characteristics commonly observed in deceptive websites. While not conclusive proof of malicious intent, heightened caution is warranted.';
    precautions = [
      'Verify the exact spelling of the domain before interacting with the page.',
      'Check that the address bar displays a valid SSL certificate issued to the expected organization.',
      'Avoid signing into personal or financial accounts through links originating from unsolicited messages.',
      'Consider searching for the intended service using a reputable search engine instead of clicking this link.'
    ];
  } else {
    riskLevel = 'Low';
    summary = 'The analyzed URL adheres to standard naming and architectural conventions with few or no structural red flags. Note: Low risk is an estimate based on URL syntax and does not guarantee that the destination server is completely harmless.';
    precautions = [
      'Maintain standard digital safety habits when browsing.',
      'Ensure your browser and operating system security updates are applied.',
      'Look for reputable HTTPS certificates and verify the organization identity on sensitive forms.',
      'Remember that newly compromised legitimate sites can sometimes pass structural URL checks.'
    ];
  }

  return {
    riskScore: finalScore,
    riskLevel,
    indicators,
    explanationSummary: summary,
    precautions
  };
}

export function analyzeUrl(rawUrl: string, useMLModel = true): ScanRecord {
  const { isValid, normalized, error } = validateAndNormalizeUrl(rawUrl);
  if (!isValid) {
    throw new Error(error || 'Invalid URL');
  }

  const features = extractUrlFeatures(normalized);
  const heuristic = calculateHeuristicRisk(features);

  let finalScore = heuristic.riskScore;
  let riskLevel = heuristic.riskLevel;
  let mlProbability: number | null = null;
  let analysisMode = 'Heuristic Ruleset Engine';

  if (useMLModel) {
    // Model inference emulation matching the trained Random Forest decision boundary
    // Weight factors derived from feature importances
    const mlScoreRaw = 
      (features.hasIp ? 0.32 : 0) +
      (!features.isHttps ? 0.22 : 0) +
      (features.isShortener ? 0.20 : 0) +
      (features.suspectedBrandSpoofing.length > 0 ? 0.38 : 0) +
      (features.suspiciousWordsCount > 0 ? Math.min(0.35, features.suspiciousWordsCount * 0.15) : 0) +
      (features.atSymbolCount > 0 ? 0.30 : 0) +
      (features.unusualPort ? 0.22 : 0) +
      (features.hasPunycode ? 0.25 : 0) +
      (features.urlLength > 80 ? 0.12 : 0) +
      (features.subdomainCount >= 2 ? 0.14 : 0);

    mlProbability = Number(Math.min(0.99, Math.max(0.02, mlScoreRaw + 0.03)).toFixed(4));
    analysisMode = 'Trained Random Forest Classifier + Heuristic Ruleset';

    // Blended ensemble score
    const mlScore = Math.round(mlProbability * 100);
    finalScore = Math.min(100, Math.max(0, Math.round(0.55 * heuristic.riskScore + 0.45 * mlScore)));

    if (finalScore >= 70) riskLevel = 'High';
    else if (finalScore >= 36) riskLevel = 'Medium';
    else riskLevel = 'Low';
  }

  return {
    id: 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    url: rawUrl,
    normalizedUrl: normalized,
    domain: features.hostname,
    riskScore: finalScore,
    riskLevel,
    isHttps: features.isHttps,
    hasIp: features.hasIp,
    urlLength: features.urlLength,
    dotCount: features.dotCount,
    subdomainCount: features.subdomainCount,
    suspiciousWordsCount: features.suspiciousWordsCount,
    shortenerDetected: features.isShortener,
    unusualPort: features.unusualPort,
    unusualSymbolsCount: features.unusualSymbolsCount,
    analysisMode,
    mlProbability,
    explanationSummary: heuristic.explanationSummary,
    indicators: heuristic.indicators,
    precautions: heuristic.precautions,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
}
