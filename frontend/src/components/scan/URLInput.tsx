import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link2, X, ChevronDown, Clipboard, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface Props {
  onAnalyze: (url: string) => void;
  loading:   boolean;
}

const SAMPLE_SAFE = [
  'https://www.google.com',
  'https://github.com',
  'https://stackoverflow.com',
  'https://wikipedia.org',
];

const SAMPLE_PHISHING = [
  'http://192.168.1.1/paypal-verify-account',
  'http://secure-login-paypa1.tk/verify',
  'https://bit.ly/free-crypto-wallet-claim',
  'http://amazon-account-suspended.xyz/login',
];

export default function URLInput({ onAnalyze, loading }: Props) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<{ url: string }>();
  const url = watch('url', '');
  const [showSamples, setShowSamples] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { ref: formRef, ...rest } = register('url', {
    required: 'Please enter a URL',
    minLength: { value: 3, message: 'URL too short' },
  });

  const submit = handleSubmit(data => {
    setShowSamples(false);
    onAnalyze(data.url.trim());
  });

  const setUrl = (u: string) => {
    setValue('url', u, { shouldValidate: true });
    setShowSamples(false);
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
    } catch {}
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const text = e.dataTransfer.getData('text');
    if (text) setUrl(text.trim());
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={submit} noValidate>
        <div
          className={`relative rounded-2xl transition-all duration-300 ${
            dragOver ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-card
                          focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all duration-200 url-input">
            <Link2 className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />

            <input
              {...rest}
              ref={e => { formRef(e); (inputRef as any).current = e; }}
              type="url"
              id="url-input"
              placeholder="Enter any URL to scan…  e.g. https://example.com"
              autoComplete="off"
              spellCheck={false}
              aria-label="URL to scan"
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 text-base
                         placeholder:text-slate-400 dark:placeholder:text-slate-600
                         outline-none font-mono"
            />

            {url && (
              <button
                type="button"
                onClick={() => { reset(); setShowSamples(false); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                aria-label="Clear URL"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={paste}
              className="text-slate-400 hover:text-indigo-500 transition-colors p-1 shrink-0"
              title="Paste from clipboard"
              aria-label="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4" />
            </button>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600
                         text-white font-semibold text-sm rounded-xl shadow-sm shrink-0
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  Scanning…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Scan
                </>
              )}
            </motion.button>
          </div>

          {/* Validation error */}
          <AnimatePresence>
            {errors.url && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 text-sm text-red-500 flex items-center gap-1.5 px-2"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {errors.url.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Sample URLs */}
      <div className="mt-3">
        <button
          onClick={() => setShowSamples(s => !s)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors mx-auto"
        >
          Try a sample URL
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSamples ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showSamples && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden"
            >
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
                  ✅ Safe examples
                </p>
                {SAMPLE_SAFE.map(u => (
                  <button
                    key={u}
                    onClick={() => setUrl(u)}
                    className="block w-full text-left text-xs font-mono text-slate-600 dark:text-slate-400
                               hover:text-indigo-500 dark:hover:text-indigo-400 py-1 truncate transition-colors"
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1">
                  🚨 Phishing examples
                </p>
                {SAMPLE_PHISHING.map(u => (
                  <button
                    key={u}
                    onClick={() => setUrl(u)}
                    className="block w-full text-left text-xs font-mono text-slate-600 dark:text-slate-400
                               hover:text-red-500 dark:hover:text-red-400 py-1 truncate transition-colors"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-3">
        Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono">Enter</kbd> or click Scan · Supports drag & drop
      </p>
    </div>
  );
}
