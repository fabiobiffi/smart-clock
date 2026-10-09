import { readdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * Generates dist/sw.js from pwa/sw.js by injecting the list of assets
 * produced by the build: the full shell is thus available offline right after
 * the first visit, without dependencies such as vite-plugin-pwa.
 */
function serviceWorker(): Plugin {
  return {
    name: 'clock-dashboard-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter((name) => !name.endsWith('.map'))
      const precache = [
        '/',
        '/manifest.webmanifest',
        '/icons/icon.svg',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        ...files.filter((f) => f !== 'index.html').map((f) => `/${f}`),
      ]
      // Version derived from the content (bundle + public/): it changes even if only the manifest or icons change.
      const hash = createHash('sha256')
      for (const name of files.sort()) {
        const item = bundle[name]
        if (item) hash.update(name).update(item.type === 'chunk' ? item.code : item.source)
      }
      const publicDir = new URL('./public/', import.meta.url)
      for (const entry of readdirSync(publicDir, { recursive: true, withFileTypes: true })) {
        if (entry.isFile()) hash.update(readFileSync(`${entry.parentPath}/${entry.name}`))
      }
      const version = hash.digest('hex').slice(0, 12)
      const template = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace('__CACHE_VERSION__', version)
          .replace('__PRECACHE_MANIFEST__', JSON.stringify(precache)),
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), serviceWorker()],
  build: {
    // The device's browser may not be fully up to date:
    // conservative target, no overly recent syntax in the bundle.
    target: ['chrome87', 'es2020'],
    cssTarget: 'chrome87',
  },
  server: {
    host: true,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
