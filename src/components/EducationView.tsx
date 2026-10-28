import React from 'react';
import { 
  AlertTriangle, 
  Globe, 
  Lock, 
  Type, 
  ShieldCheck, 
  PhoneCall, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const EducationView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Cybersecurity Education & Phishing Defense Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Practical knowledge to help recognize deceptive links and safeguard personal and organization credentials.
        </p>
      </div>

      {/* Grid of Education Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Module 1: Mechanics */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">1. How Social Engineering & Phishing Works</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Phishing is social engineering where adversaries disguise themselves as trusted institutions (banks, email providers, tech giants, delivery services).
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">&bull;</span>
              <span><strong>Manufactured Urgency:</strong> Threatens imminent harm ("Account closed in 24h", "Unauthorized charge").</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">&bull;</span>
              <span><strong>Cloned Login Interfaces:</strong> Pixel-accurate copies of brand forms designed to capture passwords and 2FA tokens.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">&bull;</span>
              <span><strong>Delivery Multi-Vectors:</strong> SMS (Smishing), QR codes (Quishing), and deceptive spear-phishing emails.</span>
            </li>
          </ul>
        </div>

        {/* Module 2: URL Anatomy */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">2. Anatomy of a Deceptive URL</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Always inspect hostnames by reading backwards from the first single forward slash back to the registered domain.
          </p>
          {/* Interactive URL Diagram */}
          <div className="p-3 rounded-lg bg-[#070c18] border border-slate-800 font-mono text-xs space-y-2">
            <div className="text-xs leading-loose">
              <span className="text-slate-500">https://</span>
              <span className="text-cyan-400 font-bold bg-cyan-950/40 px-1 rounded">paypal.com.</span>
              <span className="text-amber-400 font-bold bg-amber-950/40 px-1 rounded">verify-login-portal.xyz</span>
              <span className="text-slate-500">/signin</span>
            </div>
            <div className="border-t border-slate-800/80 pt-2 space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-300"><strong>Actual Domain:</strong> <code>verify-login-portal.xyz</code> (Attacker controlled)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-slate-400"><strong>Deceptive Prefix:</strong> <code>paypal.com</code> is only an arbitrary subdomain label!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: HTTPS Myth */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">3. The Common Myth: "HTTPS Means Safe"</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The padlock icon does <strong>NOT</strong> verify that the site owner is trustworthy!
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">&bull;</span>
              <span><strong>What HTTPS Means:</strong> Traffic between your browser and that specific server is encrypted from eavesdropping on public Wi-Fi.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">&bull;</span>
              <span><strong>Free SSL Certificates:</strong> Automated CAs issue free Domain Validated (DV) certificates to anyone, including threat actors. Over 80% of phishing links use HTTPS today.</span>
            </li>
          </ul>
        </div>

        {/* Module 4: Typosquatting */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Type className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">4. Typosquatting & Homoglyph Spoofing</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Adversaries register lookalike domains designed to bypass visual scanning:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">&bull;</span>
              <span><strong>Typosquatting:</strong> Subtle misspellings (e.g., <code>goolge.com</code>, <code>paypa1.com</code>, <code>arnazon.com</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">&bull;</span>
              <span><strong>Combosquatting:</strong> Affixing security keywords (e.g., <code>netflix-security-update.com</code>).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold">&bull;</span>
              <span><strong>IDN Homoglyphs:</strong> Substituting Cyrillic/Greek characters that look identical to Latin letters. Browsers display these as Punycode (<code>xn--...</code>).</span>
            </li>
          </ul>
        </div>

        {/* Module 5: Safe Browsing */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">5. Core Safe Browsing Habits</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Navigate Directly:</strong> Never click login links in unsolicited messages. Type known addresses directly into your address bar.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Use Password Managers:</strong> Credential managers evaluate the exact cryptographic domain and will never autofill passwords on a spoofed domain.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Enforce Hardware 2FA:</strong> Security keys (FIDO2 / WebAuthn) are cryptographically bound to the authentic domain and cannot be stolen by phishing proxies.</span>
            </li>
          </ul>
        </div>

        {/* Module 6: Incident Response */}
        <div className="bg-[#0d1527] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">6. Incident Response: If You Clicked</h3>
          </div>
          <ol className="space-y-1.5 text-xs text-slate-300 list-decimal pl-4">
            <li><strong>Change Passwords Immediately:</strong> Reset your password on the official website from a clean browser tab.</li>
            <li><strong>Terminate Active Sessions:</strong> Use the account security panel to sign out of all other active sessions and revoke OAuth tokens.</li>
            <li><strong>Notify Banking / Credit Card Providers:</strong> If card details were submitted, freeze or request a card replacement immediately.</li>
            <li><strong>Report the Threat:</strong> Report the URL to your organization's IT department and to threat reporting repositories (PhishTank, Google Safe Browsing).</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
