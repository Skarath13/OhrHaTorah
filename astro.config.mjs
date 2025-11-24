// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    mode: 'directory',
  }),
  server: {
    port: 3005,
    host: '0.0.0.0'
  }
});
