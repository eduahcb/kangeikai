import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
      },

      // SPA mode: static build, no Node runtime to serve the client (constitution Principle V).
      // `fallback` routes every path to index.html so the client-side router handles routing.
      adapter: adapter({ fallback: 'index.html' }),
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
  },
})
