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
