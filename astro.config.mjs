// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  devToolbar: {
    enabled: false,
  },
  adapter: cloudflare({
    mode: 'directory',
    platformProxy: {
      enabled: true,
    },
  }),
  server: {
    port: 3002,
    host: '0.0.0.0'
  }
});
