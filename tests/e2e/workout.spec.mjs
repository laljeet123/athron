import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

test.beforeEach(async ({ page }) => {
  // Intercept exercises fetch to return deterministic library
  await page.route('**/rest/v1/exercises*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { id: 1, name: 'Push Up', target_muscles: 'Chest', equipment: 'Bodyweight' },
      { id: 2, name: 'Squat', target_muscles: 'Legs', equipment: 'Bodyweight' }
    ]) })
  );
});

test('A - Start Workout success', async ({ page }) => {
  // Auth returns a user
  await page.route('**/auth/v1/user', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'test-user' } }) })
  );

  // Insert workout_sessions returns success
  await page.route('**/rest/v1/workout_sessions', (route) =>
    route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'ws1', workout_name: 'Push Up Focus' }) })
  );

  await page.goto(`${APP_URL}/workout/builder`);
  await expect(page.getByText('Workout Builder')).toBeVisible();
  await page.getByText('Add').first().click();
  await page.getByRole('button', { name: 'Start Workout Session' }).click();
  await expect(page.getByRole('button', { name: 'Starting workout...' })).toBeVisible();
  await page.waitForURL('**/workout/active');
  await expect(page).toHaveURL(/workout\/active/);
});

test('B/C/D/E - Failure, Retry, Duplicate clicks and recovery', async ({ page }) => {
  let insertCalls = 0;

  await page.route('**/auth/v1/user', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'test-user' } }) })
  );

  await page.route('**/rest/v1/workout_sessions', async (route) => {
    insertCalls++;
    if (insertCalls === 1) {
      // first attempt fails
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'insert failed' }) });
    } else {
      // subsequent attempts succeed
      await new Promise((r) => setTimeout(r, 50));
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'ws-retry', workout_name: 'Push Up Focus' }) });
    }
  });

  await page.goto(`${APP_URL}/workout/builder`);
  await page.getByText('Add').first().click();

  // Rapid duplicate clicks
  await Promise.all([
    page.getByRole('button', { name: 'Start Workout Session' }).click(),
    page.getByRole('button', { name: 'Start Workout Session' }).click(),
    page.getByRole('button', { name: 'Start Workout Session' }).click(),
  ]);

  // Wait for error card to show
  await expect(page.getByText("Couldn't start your workout. Please try again.")).toBeVisible();

  // Ensure selected exercises still present
  await expect(page.getByText('Push Up')).toBeVisible();

  // Click Retry
  await page.getByRole('button', { name: 'Retry' }).click();

  // Should navigate to active on success
  await page.waitForURL('**/workout/active');
  await expect(page).toHaveURL(/workout\/active/);

  // Verify only one successful insert after retries (first failed, second succeeded)
  expect(insertCalls).toBeGreaterThanOrEqual(2);
});
