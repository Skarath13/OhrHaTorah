import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

const isDev = process.env.NODE_ENV !== 'production';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [
    ...(isDev ? [react(), keystatic()] : []),
  ],
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
});
