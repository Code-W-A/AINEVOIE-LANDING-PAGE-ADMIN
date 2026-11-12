import { defineConfig } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
const savedStatePath = process.env.PROVIDER_PROFILE_STORAGE_STATE;
const savedState = savedStatePath ? JSON.parse(fs.readFileSync(savedStatePath, 'utf8')) : undefined;
// Each run reads the fixture from Firebase instead of reusing a previous form draft.
for (const origin of savedState?.origins || []) {
  origin.localStorage = origin.localStorage.filter((entry: { name: string }) => !entry.name.startsWith('@ainevoie/provider-onboarding-draft:'));
}
const expoRoot = path.resolve(__dirname, '../expo-mobile-app');
export default defineConfig({
  testDir: './tests/smoke',
  testMatch: 'provider-profile.spec.ts',
  timeout: 180000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:8083',
    actionTimeout: 15000,
    channel: 'chrome',
    storageState: savedState,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx expo start --web --port 8083',
    cwd: expoRoot,
    env: { EXPO_PUBLIC_FIREBASE_EMULATORS: 'true', EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: '127.0.0.1', EXPO_OVERRIDE_METRO_CONFIG: path.join(expoRoot, 'scripts/profile-e2e/metro.config.cjs') },
    url: 'http://127.0.0.1:8083',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
