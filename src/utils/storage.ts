/**
 * PhishGuard Storage Layer
 * Manages scan records in localStorage, calculates real-time dashboard stats,
 * and provides CSV export capabilities.
 */

import { DashboardStats, IndicatorFrequency, ScanRecord, TrendPoint } from '../types';
import { analyzeUrl } from './urlAnalyzer';

const STORAGE_KEY = 'phishguard_scan_records_v1';

// Initial realistic baseline scans if storage is completely empty
const SEED_URLS = [
  'http://paypal-security-center.auth-update.xyz/login',
  'http://192.168.1.105/secure/banking/signin.php',
  'http://bit.ly/3xFakeBankLoginLure',
  'https://www.google.com/search?q=cybersecurity',
  'http://appleid.apple.com.verify-device-portal.xyz/auth',
  'https://github.com/torvalds/linux',
  'http://netflix.account-billing-issue.top/re-activate',
  'https://en.wikipedia.org/wiki/Transport_Layer_Security',
  'http://198.51.100.44:8080/secure/password-reset.php',
  'https://developer.mozilla.org/en-US/docs/Web/HTTP',
  'http://chase.online-security-confirmation.club/auth',
  'https://scikit-learn.org/stable/modules/ensemble.html'
];

export function getStoredScans(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic scans
      const seeded: ScanRecord[] = [];
      const now = Date.now();
      SEED_URLS.forEach((url, idx) => {
        try {
          const scan = analyzeUrl(url, true);
          // Distribute timestamps over past 6 days
          const daysAgo = (idx % 6);
          const date = new Date(now - daysAgo * 86400000 - idx * 3600000);
          scan.createdAt = date.toISOString().replace('T', ' ').substring(0, 19);
          seeded.push(scan);
        } catch {
          // Ignore seed parse err
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveScanRecord(scan: ScanRecord): void {
  const current = getStoredScans();
  // Prepend newest scan
  const updated = [scan, ...current.filter(s => s.id !== scan.id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 500)));
  } catch (e) {
    console.error('Storage quota exceeded', e);
  }
}

export function deleteScanRecord(id: string): void {
  const current = getStoredScans();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearAllScanRecords(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

export function calculateDashboardStats(scans: ScanRecord[]): DashboardStats {
  const total = scans.length;
  let high = 0;
  let medium = 0;
  let low = 0;
  let scoreSum = 0;

  for (const s of scans) {
    if (s.riskLevel === 'High') high++;
    else if (s.riskLevel === 'Medium') medium++;
    else low++;
    scoreSum += s.riskScore;
  }

  return {
    totalScans: total,
    highRisk: high,
    mediumRisk: medium,
    lowRisk: low,
    suspiciousTotal: high + medium,
    avgRiskScore: total > 0 ? Number((scoreSum / total).toFixed(1)) : 0
  };
}

export function calculateTrends(scans: ScanRecord[], days = 7): TrendPoint[] {
  const result: TrendPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().substring(0, 10);

    const dayScans = scans.filter(s => s.createdAt.startsWith(dateStr));
    const high = dayScans.filter(s => s.riskLevel === 'High').length;
    const medium = dayScans.filter(s => s.riskLevel === 'Medium').length;
    const low = dayScans.filter(s => s.riskLevel === 'Low').length;

    result.push({
      date: dateStr.substring(5), // 'MM-DD'
      total: dayScans.length,
      high,
      medium,
      low
    });
  }

  return result;
}

export function calculateIndicatorFrequencies(scans: ScanRecord[]): IndicatorFrequency[] {
  let ipCount = 0;
  let noHttps = 0;
  let longUrl = 0;
  let excessiveDots = 0;
  let subdomains = 0;
  let suspiciousKeywords = 0;
  let shortener = 0;
  let unusualPort = 0;
  let unusualSymbols = 0;

  for (const s of scans) {
    if (s.hasIp) ipCount++;
    if (!s.isHttps) noHttps++;
    if (s.urlLength > 75) longUrl++;
    if (s.dotCount > 3) excessiveDots++;
    if (s.subdomainCount >= 2) subdomains++;
    if (s.suspiciousWordsCount > 0) suspiciousKeywords++;
    if (s.shortenerDetected) shortener++;
    if (s.unusualPort) unusualPort++;
    if (s.unusualSymbolsCount > 0) unusualSymbols++;
  }

  const list: IndicatorFrequency[] = [
    { name: 'Deceptive Keywords in Hostname', count: suspiciousKeywords, severity: 'high' },
    { name: 'Unencrypted HTTP Protocol', count: noHttps, severity: 'medium' },
    { name: 'Host Uses Direct IP Address', count: ipCount, severity: 'high' },
    { name: 'Known URL Shortener Service', count: shortener, severity: 'medium' },
    { name: 'Extended URL Length (>75 chars)', count: longUrl, severity: 'low' },
    { name: 'Multiple Subdomains (>=2 levels)', count: subdomains, severity: 'medium' },
    { name: 'Unusual Symbols (@, %, // in path)', count: unusualSymbols, severity: 'medium' },
    { name: 'Non-Standard TCP Port Specified', count: unusualPort, severity: 'medium' },
    { name: 'Excessive Dots in Hostname (>3)', count: excessiveDots, severity: 'low' }
  ];
  return list.sort((a, b) => b.count - a.count);
}

export function exportScansToCsv(scans: ScanRecord[]): void {
  const headers = [
    'ID', 'Submitted URL', 'Domain', 'Risk Score', 'Risk Level',
    'HTTPS', 'IP Hostname', 'URL Length', 'Dots', 'Subdomains',
    'Shortener', 'Analysis Mode', 'Timestamp'
  ];

  const escapeCell = (val: unknown): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = scans.map(s => [
    escapeCell(s.id),
    escapeCell(s.url),
    escapeCell(s.domain),
    escapeCell(s.riskScore),
    escapeCell(s.riskLevel),
    escapeCell(s.isHttps ? 'Yes' : 'No'),
    escapeCell(s.hasIp ? 'Yes' : 'No'),
    escapeCell(s.urlLength),
    escapeCell(s.dotCount),
    escapeCell(s.subdomainCount),
    escapeCell(s.shortenerDetected ? 'Yes' : 'No'),
    escapeCell(s.analysisMode),
    escapeCell(s.createdAt)
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'phishguard_scan_history.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
