import { Shield, Github, Twitter, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">PhishGuard AI</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              An intelligent URL phishing detector powered by heuristic analysis and machine-learning-ready architecture.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {[
                { to: '/',        label: 'Home'    },
                { to: '/scan',    label: 'Scanner' },
                { to: '/history', label: 'History' },
                { to: '/tips',    label: 'Safety Tips' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="hover:text-indigo-500 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Disclaimer</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              This tool provides an automated assessment based primarily on URL characteristics and heuristics.
              It does not guarantee that a website is safe or malicious. Always exercise caution when sharing
              sensitive information online.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} PhishGuard AI. For educational purposes only.</p>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="GitHub" className="text-slate-400 hover:text-indigo-500 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Twitter" className="text-slate-400 hover:text-indigo-500 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Website" className="text-slate-400 hover:text-indigo-500 transition-colors">
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
