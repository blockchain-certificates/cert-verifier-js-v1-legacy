import { defineConfig } from 'vite';
export default defineConfig({
  test: {
    name: 'verifier-iife',
    environment: 'jsdom',
    include: ['verifier-iife.test.build.ts'],
    globals: true
  }
});
