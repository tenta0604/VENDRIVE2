import { chromium } from 'playwright';

const baseUrl = process.env.VENDRIVE_TEST_BASE_URL || 'http://127.0.0.1:4173';
const gates = [
  'tests/product-master-sync-gate.html',
  'tests/product-maker-sort-gate.html',
  'tests/ocr-compact-soldout-visit-context-gate.html',
  'tests/ocr-continuation-vendor-gate.html',
  'tests/ocr-review-field-fix-gate.html',
  'tests/visit-closeout-overlap-gate.html',
  'tests/machine-bring-opt-in-gate.html'
];

const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const gate of gates) {
    const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error?.stack || error)));

    try {
      const url = `${baseUrl.replace(/\/$/, '')}/${gate}?ci=${Date.now()}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (!response || !response.ok()) throw new Error(`HTTP ${response?.status() || 'no response'} for ${url}`);
      await page.waitForFunction(() => {
        const out = document.querySelector('#out');
        return out && out.textContent && out.textContent.trim() !== 'RUNNING';
      }, { timeout: 60_000 });
      const output = (await page.locator('#out').innerText()).trim();
      console.log(`\n=== ${gate} ===\n${output}\n`);
      if (!output.startsWith('PASS')) {
        failures.push(`${gate}: ${output}`);
      } else if (pageErrors.length) {
        failures.push(`${gate}: page errors despite PASS:\n${pageErrors.join('\n')}`);
      }
    } catch (error) {
      failures.push(`${gate}: ${String(error?.stack || error)}${pageErrors.length ? `\npage errors:\n${pageErrors.join('\n')}` : ''}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('\nBrowser regression failures:\n' + failures.map((x, i) => `${i + 1}. ${x}`).join('\n\n'));
  process.exit(1);
}

console.log(`All ${gates.length} browser regression gates passed.`);
