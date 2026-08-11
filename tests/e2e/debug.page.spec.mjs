import { test } from '@playwright/test';

test('debug page console', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE LOG', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR', err.message));
  page.on('requestfailed', (req) => {
    const failure = req.failure();
    console.log('REQUEST FAILED', req.url(), failure && failure.errorText);
  });

  const APP_URL = process.env.APP_URL || 'http://localhost:5173';
  console.log('DEBUG: navigating to', APP_URL);
  await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('DEBUG: navigating to /workout/builder');
  await page.goto(`${APP_URL}/workout/builder`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('DEBUG: final URL', page.url());
  await page.screenshot({ path: 'test-results/debug-page.png' });
});
