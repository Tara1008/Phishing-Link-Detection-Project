import axios from 'axios';
import { useState, useCallback } from 'react';
import type { ScanResult } from '../types';
import toast from 'react-hot-toast';

//const api = axios.create({ baseURL: '/api' });
const api = axios.create({
  baseURL: 'https://phishing-link-detection-project-production.up.railway.app/api',
});

export interface UseAnalyzeReturn {
  result:    ScanResult | null;
  loading:   boolean;
  error:     string | null;
  analyze:   (url: string) => Promise<ScanResult | null>;
  clearResult: () => void;
}

/** Session id — generated once per browser session */
function getSessionId(): string {
  let id = sessionStorage.getItem('pg-session');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('pg-session', id);
  }
  return id;
}

export function useAnalyze(): UseAnalyzeReturn {
  const [result,  setResult]  = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const analyze = useCallback(async (url: string): Promise<ScanResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/analyze', {
        url: url.trim(),
        session_id: getSessionId(),
      });
      //added in git
      console.log("API RESPONSE:", data);

      if (!data.success) throw new Error(data.error ?? 'Analysis failed');

      setResult(data.data);
      return data.data;
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Analysis failed';
      setError(msg);
      toast.error(msg, { id: 'analyze-error' });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, clearResult };
}

// ── Standalone fetch for history page ─────────────────────────────
export async function fetchHistory(limit = 50): Promise<ScanResult[]> {
  const session_id = sessionStorage.getItem('pg-session') ?? '';
  const { data } = await api.get('/history', {
    params: { limit, session_id: session_id || undefined },
  });
  return data.data ?? [];
}

export async function deleteScanById(id: number): Promise<void> {
  await api.delete(`/history/${id}`);
}

export async function clearAllHistory(): Promise<void> {
  const session_id = sessionStorage.getItem('pg-session') ?? '';
  await api.delete('/history/clear', {
    params: { session_id: session_id || undefined },
  });
}

export async function fetchStats() {
  const { data } = await api.get('/stats');
  return data.data;
}
