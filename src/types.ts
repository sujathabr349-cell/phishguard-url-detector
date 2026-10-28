/**
 * PhishGuard Type Definitions
 */

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface ThreatIndicator {
  name: string;
  impact: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ExtractedFeatures {
  url: string;
  scheme: string;
  hostname: string;
  path: string;
  query: string;
  isHttps: boolean;
  hasIp: boolean;
  urlLength: number;
  hostnameLength: number;
  pathLength: number;
  dotCount: number;
  subdomainCount: number;
  isShortener: boolean;
  suspiciousWordsHost: string[];
  suspiciousWordsPath: string[];
  suspiciousWordsCount: number;
  suspectedBrandSpoofing: string[];
  atSymbolCount: number;
  hyphenCountHost: number;
  doubleSlashInPath: boolean;
  percentCount: number;
  hasUrlEncoding: boolean;
  tildeCount: number;
  unusualSymbolsCount: number;
  port: number | null;
  unusualPort: boolean;
  hostEntropy: number;
  hasPunycode: boolean;
}

export interface ScanRecord {
  id: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  riskScore: number;
  riskLevel: RiskLevel;
  isHttps: boolean;
  hasIp: boolean;
  urlLength: number;
  dotCount: number;
  subdomainCount: number;
  suspiciousWordsCount: number;
  shortenerDetected: boolean;
  unusualPort: boolean;
  unusualSymbolsCount: number;
  analysisMode: string;
  mlProbability: number | null;
  explanationSummary: string;
  indicators: ThreatIndicator[];
  precautions: string[];
  createdAt: string;
}

export interface DashboardStats {
  totalScans: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  suspiciousTotal: number;
  avgRiskScore: number;
}

export interface TrendPoint {
  date: string;
  total: number;
  high: number;
  medium: number;
  low: number;
}

export interface IndicatorFrequency {
  name: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

export type ViewTab = 'scanner' | 'dashboard' | 'history' | 'reports' | 'education' | 'code-explorer';
