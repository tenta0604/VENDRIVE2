# VENDRIVE2 OCR Adapter Contract v1

AN14B1 intentionally does not embed an OCR endpoint, API key, or provider credential in GitHub Pages.

Production OCR is supplied at runtime as `window.VENDRIVE2OCRAdapter`:

```js
window.VENDRIVE2OCRAdapter = {
  version: 1,
  async analyze({ file, image, supportedReportTypes }) {
    // Send the File only after the user explicitly presses "OCRで読み取る".
    // Call a trusted server-side relay. Never place provider secrets in this app.
    return {
      provider: "provider-name",
      requestId: "opaque-request-id",
      detectedType: "sales", // sales | input | recovery | input_recovery | null
      typeConfidence: 0.95,  // 0..1 | null
      occurredAt: "2026-09-14T12:00:00+09:00", // optional
      makerKey: "maker",     // optional
      vendorNumber: "123",   // optional
      machineId: "M1",       // optional
      candidatePayload: {},  // structured candidate only
      warnings: []
    };
  }
};
```

The adapter response must not contain image bytes, base64/Data URLs, raw OCR text, blobs, or raw image fields. VENDRIVE2 rejects those fields.

The image is never uploaded merely by selecting it. Upload can only start from the explicit OCR button action.

OCR output remains a review candidate. AN14B1 does not create or confirm a report.


## Draft creation boundary (AN14B2)

`capture.createDraftFromReview({ review, userApproved: true })` accepts only a version 2 reviewed OCR candidate.

It revalidates the report payload using the existing report validator and creates a report with source method `ocr`. It never confirms the report and never applies inventory movement. If the payload is structurally valid but not ready to confirm (for example, quantity or amount mismatch), the saved report remains `needs_review`.

Production UI wiring for field-level corrections is intentionally deferred until real report samples are available, so the review form can match the actual paper layouts instead of guessing.

## Production provider boundary (AN14B3A)

Production OCR is connected through the Vercel relay at runtime. GitHub Pages contains only the relay endpoint configuration; the Gemini credential remains a Vercel Secret and is never embedded in client code.

The relay calls Google Gemini directly using `gemini-3.6-flash`, accepts only explicit user-triggered image uploads, enforces the relay image-size/origin boundary, and returns only the structured OCR contract. Raw OCR text, image bytes, base64/Data URLs, provider credentials, and other secrets are not returned to the client.

OCR output still enters the existing review flow. The relay does not auto-confirm reports, write analytics, mutate legacy data, or apply inventory movement.

## Sales real-paper review boundary (AN14B3B1)

The sales-journal review UI is calibrated from a real paper sample. It exposes structured header fields, printed totals, product rows, sold-out rows, and quantity/amount consistency feedback for human correction.

A user must explicitly confirm that the structured values were compared with the paper before an Analytics OCR draft can be created. The draft is not automatically confirmed, no inventory movement is applied, and legacy operational storage is not written.

Input, recovery, and joined input/recovery field-level layouts remain deferred to **AN14B3B2** until real paper samples are available. Their layouts must not be guessed.

