import type { NewsItem, NewsReport } from '../shared/types.ts'
import { createPolledSource } from './polled.ts'

const TIMEOUT_MS = 10_000
const MAX_ITEMS = 15

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/** Decodes the most common XML/HTML entities (named and numeric). */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const value = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(value) ? String.fromCodePoint(value) : match
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match
  })
}

function tagContent(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i').exec(xml)
  if (!match?.[1]) return null
  const raw = match[1].trim()
  const cdata = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(raw)
  return cdata?.[1] !== undefined ? cdata[1].trim() : decodeEntities(raw)
}

/** Plain text: no HTML tags, whitespace collapsed. */
function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** Minimal RSS 2.0 parser, sufficient for ANSA feeds. Skips incomplete items. */
export function parseRss(xml: string, maxItems = MAX_ITEMS): NewsItem[] {
  const items: NewsItem[] = []
  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1] ?? ''
    const title = tagContent(block, 'title')
    const link = tagContent(block, 'link')
    if (!title || !link) continue
    const summary = tagContent(block, 'description')
    const pubDate = tagContent(block, 'pubDate')
    const time = pubDate ? Date.parse(pubDate) : NaN
    items.push({
      title: plainText(title),
      summary: summary ? plainText(summary) || null : null,
      link,
      publishedAt: Number.isNaN(time) ? null : new Date(time).toISOString(),
    })
  }
  // Most recent first (items without a date stay at the end, in feed order).
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ta = a.item.publishedAt ? Date.parse(a.item.publishedAt) : -Infinity
      const tb = b.item.publishedAt ? Date.parse(b.item.publishedAt) : -Infinity
      return tb - ta || a.index - b.index
    })
    .slice(0, maxItems)
    .map(({ item }) => item)
}

export function createNewsService(feedUrl: string, sourceName: string, refreshMs: number) {
  const source = createPolledSource(async () => {
    const response = await fetch(feedUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'clock-dashboard/1.0', accept: 'application/rss+xml, application/xml, text/xml' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const items = parseRss(await response.text())
    if (items.length === 0) throw new Error('Empty feed')
    return items
  }, refreshMs)

  return {
    start: source.start,
    stop: source.stop,
    getReport(): NewsReport {
      const { data, fetchedAt, error } = source.getState()
      return { source: sourceName, items: data ?? [], fetchedAt, error }
    },
  }
}
