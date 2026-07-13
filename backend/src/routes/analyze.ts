import { Router } from 'express';
import { validateBody, analyzeSchema } from '../middleware/validation';
import { extractFeatures }     from '../modules/featureExtractor';
import { calculateRisk }       from '../modules/riskCalculator';
import { generateReasons, generateRecommendation } from '../modules/explanationGenerator';
import { insertScan }          from '../db/queries';

const router = Router();

/**
 * POST /api/analyze
 * Body: { url: string, session_id?: string }
 */
router.post('/', validateBody(analyzeSchema), async (req, res) => {
  const startTime = Date.now();
  const { url, session_id } = req.body;

  try {
    // 1. Extract features
    const features = extractFeatures(url);

    // 2. Calculate risk
    const { riskScore, classification, securityGrade, riskLevel,
            confidence, triggeredRules,
            featureImportances } = calculateRisk(features);

    // 3. Generate reasons (ML feature-importance-driven)
    const reasons = generateReasons(features, triggeredRules, featureImportances);


    // 4. Recommendation
    const recommendations = generateRecommendation(classification);

    const scanDuration = Date.now() - startTime;

    // 5. Persist to MySQL
    const scanPayload = {
      url,
      protocol:         features.protocol,
      domain:           features.domain,
      subdomain:        features.subdomain,
      path:             features.path,
      tld:              features.tld,
      risk_score:       riskScore,
      classification,
      confidence,
      security_grade:   securityGrade,
      risk_level:       riskLevel,
      features,
      reasons,
      recommendations,
      scan_duration_ms: scanDuration,
      session_id:       session_id ?? '',
    };

    const id = await insertScan(scanPayload);

    res.json({
      success: true,
      data: {
        id,
        ...scanPayload,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

export default router;
