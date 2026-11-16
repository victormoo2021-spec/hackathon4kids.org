import { defineConfig, devices } from '@playwright/test'

const PORT = 3200
// software GL so WebGL2 works headless locally and in CI
const GL_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: { args: GL_ARGS } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { args: GL_ARGS } } },
  ],
  // Tests run against the production build.
  webServer: {
    command: `node_modules/.bin/next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
