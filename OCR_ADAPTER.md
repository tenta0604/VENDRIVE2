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

Field-level correction UI is calibrated only from real report samples: sales in AN14B3B1 and input/recovery/joined input-recovery in AN14B3B2.

## Production provider boundary (AN14B3A)

Production OCR is connected through the Vercel relay at runtime. GitHub Pages contains only the relay endpoint configuration; the Gemini credential remains a Vercel Secret and is never embedded in client code.

The relay calls Google Gemini directly using `gemini-3.6-flash`, accepts only explicit user-triggered image uploads, enforces the relay image-size/origin boundary, and returns only the structured OCR contract. Raw OCR text, image bytes, base64/Data URLs, provider credentials, and other secrets are not returned to the client.

OCR output still enters the existing review flow. The relay does not auto-confirm reports, write analytics, mutate legacy data, or apply inventory movement.

## Sales real-paper review boundary (AN14B3B1)

The sales-journal review UI is calibrated from a real paper sample. It exposes structured header fields, printed totals, product rows, sold-out rows, and quantity/amount consistency feedback for human correction.

A user must explicitly confirm that the structured values were compared with the paper before an Analytics OCR draft can be created. The draft is not automatically confirmed, no inventory movement is applied, and legacy operational storage is not written.

## Input / recovery real-paper review boundary (AN14B3B2)

Real samples confirmed three production layouts: standalone **投入確認**, standalone **回収品確認**, and a joined paper that prints both sections.

The input review exposes the printed header, counter rows (売価・枝番・前回・今回・売上数), card/cash/sales amounts, product input rows, and printed 投入合計. It checks row counter deltas, counter-derived sales amount, payment arithmetic, and product-row quantity totals before draft creation.

The recovery review preserves the printed **ケース** and **バラ** counts separately. Inventory movement continues to use the existing unit quantity field. When ケース is zero, unit quantity must match バラ. When ケース is nonzero, the UI requires a reviewed unit-equivalent quantity rather than inventing a case conversion.

The joined `input_recovery` review uses the same two calibrated sections inside one explicit review. All three layouts keep the same safety boundary: human comparison is required, only an Analytics OCR draft can be created, and no automatic confirmation, inventory movement, image retention, raw OCR retention, or legacy write occurs.

