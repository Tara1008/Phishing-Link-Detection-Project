import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useCallback } from 'react';
import { Shield, ScanLine } from 'lucide-react';
import URLInput       from '../components/scan/URLInput';
import ResultCard     from '../components/scan/ResultCard';
import ReasonsAccordion from '../components/scan/ReasonsAccordion';
import BreakdownPanel from '../components/scan/BreakdownPanel';
import ChartsSection  from '../components/scan/ChartsSection';
import ExportPanel    from '../components/scan/ExportPanel';
import { useAnalyze } from '../hooks/useAnalyze';

// ── Confetti animation ────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  type Particle = { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; rv: number };
  const colors  = ['#6366f1', '#8b5cf6', '#22c55e', '#14b8a6', '#f59e0b', '#ef4444'];
  const particles: Particle[] = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rv: (Math.random() - 0.5) * 10,
  }));

  let frame = 0;
  const anim = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.rotation += p.rv;
      p.vy += 0.08;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx.restore();
    });
    frame++;
    if (frame < 180) requestAnimationFrame(anim);
    else canvas.remove();
  };
  requestAnimationFrame(anim);
}

// ── Section wrapper ───────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-semibold text-slate-800 dark:text-white text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ScanPage() {
  const { result, loading, analyze } = useAnalyze();
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(async (url: string) => {
    const r = await analyze(url);
    if (r) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      if (r.classification === 'safe') launchConfetti();
    }
  }, [analyze]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120]">
      {/* ── Hero Scanner Section ──────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-100/60 dark:bg-indigo-900/10 rounded-full blob blur-3xl" />
          <div className="absolute -top-16 -right-24 w-72 h-72 bg-purple-100/60 dark:bg-purple-900/10 rounded-full blob blob-delay-2 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">URL Scanner</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3"
          >
            Scan Any URL for <span className="gradient-text">Phishing Threats</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto"
          >
            Enter a URL below and get an instant risk score, security grade, and full explanation in under 100ms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <URLInput onAnalyze={handleAnalyze} loading={loading} />
          </motion.div>
        </div>
      </div>

      {/* ── Loading skeleton ──────────────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 pb-16 space-y-6"
          >
            {[220, 320, 180].map((h, i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: h }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && !loading && (
      //edited here
      <>
        {console.log("RESULT:", result)}
        ///till here
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 pb-20 space-y-6"
          >
            {/* Result Summary */}
            <ResultCard result={result} />

            {/* Charts */}
            <ChartsSection result={result} />

            {/* Two-column: Reasons + Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="🔍 Analysis Reasons">
                <ReasonsAccordion reasons={result.reasons} />
              </Section>
              <Section title="🔗 URL Breakdown">
                <BreakdownPanel features={result.features} />
              </Section>
            </div>

            {/* Export */}
            <Section title="📤 Export Report">
              <ExportPanel result={result} />
            </Section>

            {/* Disclaimer */}
            <p className="text-xs text-center text-slate-400 dark:text-slate-600 px-4">
              ⚠️ This tool provides an automated assessment based on URL characteristics only. It does not guarantee that a website is safe or malicious. Always exercise caution.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-xl mx-auto px-4 pb-20 text-center"
        >
          <Shield className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
          <p className="text-slate-400 dark:text-slate-600 text-sm">Enter a URL above to start scanning</p>
        </motion.div>
      )}
    </div>
  );
}
