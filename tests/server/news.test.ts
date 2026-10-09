import { describe, expect, it } from 'vitest'
import { decodeEntities, parseRss } from '../../server/news.ts'

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>RSS di Ultima ora - ANSA.it</title>
  <item>
    <title><![CDATA[Zelensky, 'revoca delle sanzioni è debolezza']]></title>
    <description><![CDATA['Gioca a favore della Russia']]></description>
    <link>https://www.ansa.it/a.html</link><pubDate>Fri, 9 Oct 2026 21:40:00 +0200</pubDate>
  </item>
  <item>
    <title>Borsa &amp; mercati: Milano chiude in rialzo</title>
    <description>&lt;p&gt;Ftse Mib &lt;b&gt;+1%&lt;/b&gt;&lt;/p&gt;</description>
    <link>https://www.ansa.it/b.html</link><pubDate>Fri, 9 Oct 2026 21:46:22 +0200</pubDate>
  </item>
  <item><title>Senza link</title></item>
</channel></rss>`

describe('parseRss', () => {
  it('extracts title, summary, link and date, most recent first', () => {
    const items = parseRss(FEED)
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({
      title: 'Borsa & mercati: Milano chiude in rialzo',
      summary: 'Ftse Mib +1%',
      link: 'https://www.ansa.it/b.html',
      publishedAt: '2026-10-09T19:46:22.000Z',
    })
    expect(items[1]?.title).toBe("Zelensky, 'revoca delle sanzioni è debolezza'")
  })

  it('respects the maximum number of items', () => {
    expect(parseRss(FEED, 1)).toHaveLength(1)
  })

  it('invalid feed → no items', () => {
    expect(parseRss('<html>not a feed</html>')).toEqual([])
  })
})

describe('decodeEntities', () => {
  it('named and numeric', () => {
    expect(decodeEntities('a &amp; b &#232; &#xE0; &quot;x&quot; &unknown;')).toBe('a & b è à "x" &unknown;')
  })
})
