// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: vercel({
    // Auto-inject the Vercel Web Analytics + Speed Insights scripts on
    // every page, replacing the previous per-layout components.
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
  }),
});