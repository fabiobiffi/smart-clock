import { createServer, type ServerResponse } from 'node:http'
import { fileURLToPath } from 'node:url'
import { SERVER_CONFIG, SERVICES, STOCKS } from './config.ts'
import { createHealthMonitor } from './health/monitor.ts'
import { hasConnectivity, httpProbe } from './health/probe.ts'
import { createStaticHandler } from './static.ts'
import { createNewsService } from './news.ts'
import { createStocksService } from './stocks.ts'
import { reverseGeocode } from './geocode.ts'
import { createWeatherService, parseCoordinates } from './weather.ts'

const distDir = fileURLToPath(new URL('../dist/', import.meta.url))

const monitor = createHealthMonitor(SERVICES, {
  intervalMs: SERVER_CONFIG.healthIntervalMs,
  retryMs: SERVER_CONFIG.healthRetryMs,
  probe: httpProbe,
  connectivity: SERVER_CONFIG.connectivityProbeUrl
    ? () => hasConnectivity(SERVER_CONFIG.connectivityProbeUrl)
    : undefined,
})
const weather = createWeatherService(SERVER_CONFIG.weatherLocation, SERVER_CONFIG.weatherRefreshMs, reverseGeocode)
const news = createNewsService(SERVER_CONFIG.newsFeedUrl, SERVER_CONFIG.newsSourceName, SERVER_CONFIG.newsRefreshMs)
const stocks = createStocksService(STOCKS, SERVER_CONFIG.stocksRefreshMs)
const serveStatic = createStaticHandler(distDir)

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

const server = createServer((req, res) => {
  res.setHeader('x-content-type-options', 'nosniff')
  res.setHeader('referrer-policy', 'no-referrer')

  const { pathname, searchParams } = new URL(req.url ?? '/', 'http://localhost')

  // Only action: manual re-check of a configured service (no arbitrary URLs).
  const manualCheck = /^\/api\/services\/([a-z0-9-]+)\/check$/.exec(pathname)
  if (manualCheck && req.method === 'POST') {
    const id = manualCheck[1] ?? ''
    monitor.checkNow(id).then(
      (found) => (found ? sendJson(res, 200, monitor.getReport()) : sendJson(res, 404, { error: 'Unknown service' })),
      (error: unknown) => {
        console.error('manual check error', error)
        sendJson(res, 500, { error: 'Check failed' })
      },
    )
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end()
    return
  }

  switch (pathname) {
    case '/api/ping':
      return sendJson(res, 200, { ok: true })
    case '/api/services':
      return sendJson(res, 200, monitor.getReport())
    case '/api/weather': {
      // Optional coordinates from the client's geolocation; otherwise the default location.
      const coords = parseCoordinates(searchParams.get('lat'), searchParams.get('lon'))
      if (!coords) return sendJson(res, 200, weather.getReport())
      weather.getReportFor(coords.latitude, coords.longitude).then(
        (report) => sendJson(res, 200, report),
        () => sendJson(res, 200, weather.getReport()),
      )
      return
    }
    case '/api/news':
      return sendJson(res, 200, news.getReport())
    case '/api/stocks':
      return sendJson(res, 200, stocks.getReport())
  }
  if (pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'Not found' })

  serveStatic(req, res, pathname).catch((error: unknown) => {
    console.error('static error', error)
    if (!res.headersSent) res.writeHead(500).end()
  })
})

server.listen(SERVER_CONFIG.port, () => {
  console.log(
    `clock-dashboard listening on :${SERVER_CONFIG.port} (${SERVICES.length} services, every ${SERVER_CONFIG.healthIntervalMs / 1000}s)`,
  )
  monitor.start()
  weather.start()
  news.start()
  stocks.start()
})

function shutdown(): void {
  monitor.stop()
  weather.stop()
  news.stop()
  stocks.stop()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
