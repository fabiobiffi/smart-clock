import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream'
import { stat } from 'node:fs/promises'
import { extname, normalize, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

function cacheControl(pathname: string): string {
  // Assets with a hash in the name: immutable. Shell and service worker: always revalidated.
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (pathname.startsWith('/icons/')) return 'public, max-age=86400'
  return 'no-cache'
}

async function fileIfExists(path: string): Promise<number | null> {
  try {
    const info = await stat(path)
    return info.isFile() ? info.size : null
  } catch {
    return null
  }
}

export function createStaticHandler(rootDir: string) {
  const root = resolve(rootDir)
  const indexPath = resolve(root, 'index.html')

  return async function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
    let decoded: string
    try {
      decoded = decodeURIComponent(pathname)
    } catch {
      res.writeHead(400).end()
      return
    }
    const candidate = resolve(root, '.' + normalize(decoded))
    if (candidate !== root && !candidate.startsWith(root + sep)) {
      res.writeHead(403).end()
      return
    }

    let filePath = candidate
    let size = await fileIfExists(filePath)
    // SPA fallback: only for navigations, not for missing assets.
    if (size === null && !extname(decoded)) {
      filePath = indexPath
      size = await fileIfExists(filePath)
    }
    if (size === null) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found')
      return
    }

    res.writeHead(200, {
      'content-type': MIME[extname(filePath)] ?? 'application/octet-stream',
      'content-length': size,
      'cache-control': filePath === indexPath ? 'no-cache' : cacheControl(pathname),
    })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    pipeline(createReadStream(filePath), res, (error) => {
      if (error) res.destroy()
    })
  }
}
