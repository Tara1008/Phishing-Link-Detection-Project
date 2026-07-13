import { pool } from './pool';
import type { ScanResult, ScanStats } from '../types';

// ----------------------------------------------------------------
// Insert a new scan result and return the inserted row's id
// ----------------------------------------------------------------
export async function insertScan(result: Omit<ScanResult, 'id' | 'created_at'>): Promise<number> {
  const [res] = await pool.execute(
    `INSERT INTO scan_results
      (url, protocol, domain, subdomain, path, tld,
       risk_score, classification, confidence, security_grade,
       risk_level, features, reasons, recommendations,
       scan_duration_ms, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      result.url,
      result.protocol,
      result.domain,
      result.subdomain,
      result.path,
      result.tld,
      result.risk_score,
      result.classification,
      result.confidence,
      result.security_grade,
      result.risk_level,
      JSON.stringify(result.features),
      JSON.stringify(result.reasons),
      result.recommendations,
      result.scan_duration_ms,
      result.session_id,
    ]
  ) as any;

  return (res as any).insertId as number;
}

// ----------------------------------------------------------------
// Retrieve paginated history (newest first)
// ----------------------------------------------------------------
export async function getHistory(
  limit = 50,
  offset = 0,
  sessionId?: string
): Promise<ScanResult[]> {
  const params: (string | number)[] = [];
  let where = '';

  if (sessionId) {
    where = 'WHERE session_id = ?';
    params.push(sessionId);
  }

  params.push(limit, offset);

  const [rows] = await pool.execute(
    `SELECT * FROM scan_results ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    params
  ) as any;

  return (rows as any[]).map(parseRow);
}

// ----------------------------------------------------------------
// Get a single scan by id
// ----------------------------------------------------------------
export async function getScanById(id: number): Promise<ScanResult | null> {
  const [rows] = await pool.execute(
    'SELECT * FROM scan_results WHERE id = ? LIMIT 1',
    [id]
  ) as any;

  const arr = rows as any[];
  return arr.length ? parseRow(arr[0]) : null;
}

// ----------------------------------------------------------------
// Delete a single scan
// ----------------------------------------------------------------
export async function deleteScan(id: number): Promise<boolean> {
  const [res] = await pool.execute(
    'DELETE FROM scan_results WHERE id = ?',
    [id]
  ) as any;
  return (res as any).affectedRows > 0;
}

// ----------------------------------------------------------------
// Clear all history (optionally scoped to session)
// ----------------------------------------------------------------
export async function clearHistory(sessionId?: string): Promise<number> {
  if (sessionId) {
    const [res] = await pool.execute(
      'DELETE FROM scan_results WHERE session_id = ?',
      [sessionId]
    ) as any;
    return (res as any).affectedRows;
  }
  const [res] = await pool.execute('DELETE FROM scan_results') as any;
  return (res as any).affectedRows;
}

// ----------------------------------------------------------------
// Aggregate stats from the view
// ----------------------------------------------------------------
export async function getStats(): Promise<ScanStats> {
  const [rows] = await pool.execute('SELECT * FROM scan_stats LIMIT 1') as any;
  const row = (rows as any[])[0] ?? {};
  return {
    total_scans:      Number(row.total_scans     ?? 0),
    safe_count:       Number(row.safe_count      ?? 0),
    suspicious_count: Number(row.suspicious_count ?? 0),
    phishing_count:   Number(row.phishing_count  ?? 0),
    avg_risk_score:   Number(row.avg_risk_score  ?? 0),
    phishing_pct:     Number(row.phishing_pct    ?? 0),
    safe_pct:         Number(row.safe_pct        ?? 0),
    first_scan:       row.first_scan ?? null,
    last_scan:        row.last_scan  ?? null,
  };
}

// ----------------------------------------------------------------
// Recent scans for timeline chart (last 30)
// ----------------------------------------------------------------
export async function getRecentScans(limit = 30): Promise<ScanResult[]> {
  const [rows] = await pool.execute(
    'SELECT * FROM scan_results ORDER BY created_at DESC LIMIT ?',
    [limit]
  ) as any;
  return (rows as any[]).map(parseRow);
}

// ----------------------------------------------------------------
// Parse DB row — JSON columns come back as strings in some drivers
// ----------------------------------------------------------------
function parseRow(row: any): ScanResult {
  return {
    ...row,
    features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
    reasons:  typeof row.reasons  === 'string' ? JSON.parse(row.reasons)  : row.reasons,
    created_at: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  };
}
