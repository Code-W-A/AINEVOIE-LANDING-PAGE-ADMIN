import { test, expect } from '@playwright/test';
import path from 'node:path';
import { getDefaultProviderServiceTypeSettings, getPublicProviderServiceTypes } from '../../src/lib/providerServiceTypes';

// Uses the disposable provider fixture and authenticated browser state from the local emulator.
const uid = 'UU4Fx6vqQBaifaLPWzVc6IZ9ayQ2';
const documentUrl = `http://127.0.0.1:8087/v1/projects/demo-ainevoie-offers/databases/(default)/documents/providers/${uid}`;

test('provider retains offline edits, retries its photo and submits the saved profile', async ({ page, context, request }) => {
  test.skip(!process.env.PROVIDER_PROFILE_STORAGE_STATE, 'Set PROVIDER_PROFILE_STORAGE_STATE to an authenticated local-emulator browser state.');
  const setup = await request.patch(`${documentUrl}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=professionalProfile.coverageArea`, {
    data: { fields: {
      status: { stringValue: 'pre_registered' },
      updatedAt: { timestampValue: new Date().toISOString() },
      professionalProfile: { mapValue: { fields: { coverageArea: { mapValue: { fields: {
        countryCode: { stringValue: 'RO' }, countryName: { stringValue: 'România' },
        countyCode: { stringValue: 'BH' }, countyName: { stringValue: 'Bihor' },
        cityCode: { stringValue: 'oradea' }, cityName: { stringValue: 'Oradea' },
        placeId: { stringValue: 'local-test-oradea' }, locationLabel: { stringValue: 'Oradea TEST' },
        formattedAddress: { stringValue: 'Oradea, Bihor, România' },
        centerLat: { doubleValue: 47.0465 }, centerLng: { doubleValue: 21.9189 },
      } } } } } },
    } },
  });
  expect(setup.ok()).toBeTruthy();
  await page.route('**/api/provider-service-types', route => route.fulfill({
    status: 200,
    json: { item: { items: getPublicProviderServiceTypes(getDefaultProviderServiceTypeSettings()) } },
  }));
  await page.goto('/auth/providerOnboardingScreen');
  const dismiss = page.getByText('Not now', { exact: true });
  await expect(page.getByTestId('provider-onboarding-submit')).toBeVisible({ timeout: 30000 });
  if (await dismiss.isVisible()) await dismiss.click();
  const fullName = page.getByPlaceholder('Enter your full name');
  const business = page.getByPlaceholder('Ex: Clean Home LLC');
  await Promise.any([
    business.waitFor({ state: 'visible', timeout: 30000 }),
    expect(fullName).toHaveValue(/Prestator/, { timeout: 30000 }),
  ]);
  if (!await business.isVisible()) await page.getByTestId('provider-onboarding-submit').click();
  await expect(business).toBeVisible({ timeout: 30000 });
  if (await dismiss.isVisible()) await dismiss.click();
  const name = `Prestator TEST Playwright ${Date.now()}`;
  await context.setOffline(true);
  await business.fill(name);
  await expect(page.getByText('Your data is kept on this phone. Retry saving.', { exact: true })).toBeVisible({ timeout: 25000 });
  await expect(business).toHaveValue(name);
  if (await dismiss.isVisible()) await dismiss.click();
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await context.setOffline(false);
  await expect(page.getByText('Data saved', { exact: true })).toBeVisible({ timeout: 60000 });
  const saved = await (await request.get(documentUrl)).json();
  expect(saved.fields.professionalProfile.mapValue.fields.businessName.stringValue).toBe(name);

  await page.route('**/finalizeProviderAvatarUpload', route => route.fulfill({
    status: 503, contentType: 'application/json',
    body: JSON.stringify({ error: { status: 'UNAVAILABLE', message: 'Controlled test failure' } }),
  }));
  await page.getByText('Replace photo', { exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('Choose from gallery', { exact: true }).click();
  await (await chooser).setFiles(path.resolve(__dirname, '../../../expo-mobile-app/assets/images/onboarding/1.png'));
  await page.getByText('Salveaza poza', { exact: true }).click();
  await expect(page.getByText('The photo could not be saved. Check your connection and try again.', { exact: true }).last()).toBeVisible({ timeout: 30000 });
  await page.unroute('**/finalizeProviderAvatarUpload');
  await page.getByText('Salveaza poza', { exact: true }).click();
  await expect(page.getByText('Replace photo', { exact: true })).toBeVisible({ timeout: 30000 });
  await expect(business).toHaveValue(name);
  const avatar = await (await request.get(documentUrl)).json();
  const avatarPath = avatar.fields.professionalProfile.mapValue.fields.avatarPath.stringValue;
  const stored = await request.get(`http://127.0.0.1:9199/v0/b/demo-ainevoie-offers.appspot.com/o/${encodeURIComponent(avatarPath)}`);
  expect(stored.ok()).toBeTruthy();
  await page.reload();
  await expect(page.getByTestId('provider-onboarding-submit')).toBeVisible({ timeout: 30000 });
  await Promise.any([
    business.waitFor({ state: 'visible', timeout: 30000 }),
    expect(fullName).toHaveValue(/Prestator/, { timeout: 30000 }),
  ]);
  if (!await business.isVisible()) await page.getByTestId('provider-onboarding-submit').click();
  await expect(business).toHaveValue(name, { timeout: 30000 });
  await page.getByTestId('provider-onboarding-submit').click();
  await expect(page.getByText('Documents', { exact: true }).last()).toBeVisible();
  await page.getByTestId('provider-onboarding-submit').click();
  await page.getByTestId('provider-onboarding-submit').click();
  await expect(page.getByText('Your account is under review', { exact: true })).toBeVisible({ timeout: 30000 });
  expect((await (await request.get(documentUrl)).json()).fields.status.stringValue).toBe('pending_review');
});
