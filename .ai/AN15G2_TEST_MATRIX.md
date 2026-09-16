# AN15G2 Gemini explanation API verification

- Endpoint is separate from OCR extraction: `/api/explain`.
- Only allow VENDRIVE2 production and local origins.
- Reject non-POST and oversized/invalid JSON.
- Sanitize and bound grounding before sending to Gemini.
- Gemini prompt has explanation-only authority; no recalculation, optimization, ranking, mutation, invented facts, or unsupported causal claims.
- Structured response is limited to headline, summary, why, uncertainty, review.
- Client retains original grounding and validates presentation response.
- HTTP/provider/parse/timeout failure returns deterministic client fallback.
- No RAW, inventory, task, route, recommendation, or forecast writes.
- `GEMINI_API_KEY` remains server-side only.
- Production promotion of learned numeric models remains independent from this explanation layer.
