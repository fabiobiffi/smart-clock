/**
 * Generates the PWA PNG icons without dependencies (minimal PNG encoder).
 * Usage: npm run icons  → public/icons/*.png
 * Design: thin clock face and hands on a black background.
 */
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (const byte of buf) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size: number, pixel: (x: number, y: number) => [number, number, number]): Buffer {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y)
      const o = y * (size * 3 + 1) + 1 + x * 3
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const smooth = (d: number): number => Math.min(Math.max(0.5 - d, 0), 1)

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.min(Math.max(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0), 1)
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** scale: fraction of the side occupied by the drawing (maskable icons need a margin). */
function drawIcon(size: number, scale: number): Buffer {
  const c = size / 2
  const r = (size / 2) * scale * 0.82
  const ring = size * 0.022 * scale
  const hand = size * 0.03 * scale
  const white: [number, number, number] = [235, 235, 235]
  const accent: [number, number, number] = [138, 180, 220]
  return encodePng(size, (x, y) => {
    const px = x + 0.5
    const py = y + 0.5
    const ringA = smooth(Math.abs(Math.hypot(px - c, py - c) - r) - ring)
    // 10:10 — hour and minute hands
    const hourA = smooth(segmentDistance(px, py, c, c, c - r * 0.42, c - r * 0.3) - hand)
    const minA = smooth(segmentDistance(px, py, c, c, c + r * 0.5, c - r * 0.5) - hand * 0.8)
    const handsA = Math.max(hourA, minA)
    const mix = (col: [number, number, number], a: number, base: number[]) => base.map((v, i) => v + ((col[i] ?? 0) - v) * a)
    let px3 = mix(white, ringA, [0, 0, 0])
    px3 = mix(accent, handsA, px3)
    return px3.map((v) => Math.round(v)) as [number, number, number]
  })
}

const out = new URL('../public/icons/', import.meta.url)
writeFileSync(new URL('icon-192.png', out), drawIcon(192, 1))
writeFileSync(new URL('icon-512.png', out), drawIcon(512, 1))
writeFileSync(new URL('icon-maskable-512.png', out), drawIcon(512, 0.72))
console.log('Icons generated in public/icons/')
