import { motion } from 'framer-motion';
import { Lightbulb, Mail, QrCode, MessageSquare, Link2, Shield, Key, Lock, Smartphone, Eye } from 'lucide-react';
import { useState } from 'react';

const TIPS = [
  {
    icon: Shield, color: 'from-indigo-500 to-purple-600',
    title: 'How Phishing Works',
    content: 'Phishing attacks trick users into revealing sensitive information by impersonating trusted entities. Attackers create fake versions of legitimate websites, sending links via email, SMS, or social media. The fake site collects credentials, which are then used for fraud or identity theft.',
  },
  {
    icon: Mail, color: 'from-red-500 to-rose-600',
    title: 'Email Phishing Scams',
    content: 'Phishing emails often appear to come from banks, government agencies, or popular services. They create urgency ("Your account will be suspended!") and include malicious links. Always check the sender\'s actual email address, not just the display name. Hover over links before clicking.',
  },
  {
    icon: Eye, color: 'from-amber-500 to-orange-600',
    title: 'Fake Login Pages',
    content: 'Attackers clone login pages of Google, Facebook, PayPal, and banks pixel-by-pixel. Spot differences: check the URL carefully (pay attention to subdomains and TLDs), look for HTTPS, and verify the domain matches exactly. Even a single letter difference is a red flag.',
  },
  {
    icon: QrCode, color: 'from-teal-500 to-cyan-600',
    title: 'QR Code Phishing (Quishing)',
    content: 'QR codes can redirect to phishing URLs. Since most people can\'t read QR codes visually, attackers use them in emails, flyers, and even parking meters. Always use a QR scanner that previews the URL before opening, and be skeptical of QR codes in unexpected places.',
  },
  {
    icon: MessageSquare, color: 'from-purple-500 to-violet-600',
    title: 'SMS Phishing (Smishing)',
    content: 'Smishing uses SMS messages to trick victims. Common lures include fake delivery notifications, bank alerts, and prize claims. Never click links in unsolicited SMS messages. Visit the official website directly by typing the URL in your browser instead.',
  },
  {
    icon: Link2, color: 'from-green-500 to-emerald-600',
    title: 'URL Spoofing & Tricks',
    content: 'Attackers use clever URL tricks: using IP addresses instead of domains (http://192.168.1.1/paypal), confusable characters (rn looks like m, paypal vs paypa1), long subdomains (paypal.com.evil-site.com), and @-symbol tricks that hide the real destination.',
  },
  {
    icon: Link2, color: 'from-blue-500 to-indigo-600',
    title: 'Shortened URLs',
    content: 'URL shorteners (bit.ly, tinyurl) mask the real destination. Never click a shortened URL without expanding it first. Use tools like CheckShortURL.com or PhishGuard AI to reveal and analyze the actual destination before visiting.',
  },
  {
    icon: Lock, color: 'from-slate-500 to-slate-700',
    title: 'The HTTPS Myth',
    content: 'HTTPS means the connection is encrypted — NOT that the website is safe! Phishing sites can and do use HTTPS with valid certificates. Always check the domain name, not just the padlock icon. HTTPS is necessary but not sufficient for safety.',
  },
  {
    icon: Smartphone, color: 'from-pink-500 to-rose-600',
    title: 'Safe Browsing Tips',
    content: 'Keep your browser updated. Use browser extensions like uBlock Origin and HTTPS Everywhere. Enable phishing warnings in your browser settings. Bookmark important sites (banks, email) instead of typing URLs. Use Google Safe Browsing or similar services.',
  },
  {
    icon: Key, color: 'from-cyan-500 to-teal-600',
    title: 'Password Safety',
    content: 'Use a unique, strong password for every account. A password manager (Bitwarden, 1Password) generates and stores them securely. Enable 2FA on all important accounts. If you think you entered credentials on a phishing site, change your password immediately.',
  },
];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

export default function TipsPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4">
          <Lightbulb className="w-4 h-4" />
          Cybersecurity Education
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
          Stay Safe Online
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Learn how phishing attacks work and how to protect yourself from the most common cyber threats.
        </p>
      </div>

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {TIPS.map(({ icon: Icon, color, title, content }, i) => (
          <motion.div
            key={title}
            variants={stagger.item}
            onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card cursor-pointer overflow-hidden transition-all duration-200"
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 shrink-0 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
                  <motion.div
                    initial={false}
                    animate={{ height: activeIndex === i ? 'auto' : 0, opacity: activeIndex === i ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                      {content}
                    </p>
                  </motion.div>
                  {activeIndex !== i && (
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">Click to expand</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick reference */}
      <div className="mt-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-6 text-center">🛡️ Quick Security Checklist</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Check the full URL before clicking',
            'Look for exact domain name spelling',
            'Verify HTTPS + correct domain',
            'Don\'t trust urgency or scare tactics',
            'Use 2FA on all important accounts',
            'Never enter passwords on HTTP sites',
            'Expand shortened URLs before clicking',
            'Use a password manager',
            'Keep browser and OS updated',
            'Report suspicious emails/links',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-xs">✓</div>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
