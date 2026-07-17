/**
 * Step 107 — Tiny PNG encoder for PDF chart images (no canvas / native deps).
 * Builds an RGB quality bar chart as a Buffer suitable for @react-pdf Image.
 */

import { deflateSync } from 'node:zlib'

export type QualityChartPoint = {
  date: string
  quality: number
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcBuf), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

/**
 * Render sleep-quality bars (1–10) into a PNG Buffer for PDF embedding.
 */
export function buildQualityChartPng(
  points: QualityChartPoint[],
  width = 520,
  height = 160
): Buffer {
  const margin = { top: 16, right: 12, bottom: 28, left: 28 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const bg = [248, 250, 252] as const
  const axis = [148, 163, 184] as const
  const bar = [37, 99, 235] as const

  const pixels = Buffer.alloc(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    pixels[i * 3] = bg[0]
    pixels[i * 3 + 1] = bg[1]
    pixels[i * 3 + 2] = bg[2]
  }

  const setPixel = (x: number, y: number, rgb: readonly [number, number, number]) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = (y * width + x) * 3
    pixels[idx] = rgb[0]
    pixels[idx + 1] = rgb[1]
    pixels[idx + 2] = rgb[2]
  }

  const fillRect = (
    x0: number,
    y0: number,
    w: number,
    h: number,
    rgb: readonly [number, number, number]
  ) => {
    const x1 = Math.min(width, Math.ceil(x0 + w))
    const y1 = Math.min(height, Math.ceil(y0 + h))
    for (let y = Math.max(0, Math.floor(y0)); y < y1; y++) {
      for (let x = Math.max(0, Math.floor(x0)); x < x1; x++) {
        setPixel(x, y, rgb)
      }
    }
  }

  // Baseline
  fillRect(margin.left, margin.top + plotH, plotW, 1, axis)

  const n = Math.max(points.length, 1)
  const gap = 2
  const barW = Math.max(2, (plotW - gap * (n - 1)) / n)

  points.forEach((p, i) => {
    const q = Math.min(10, Math.max(0, p.quality))
    const h = (q / 10) * plotH
    const x = margin.left + i * (barW + gap)
    const y = margin.top + plotH - h
    fillRect(x, y, barW, h, bar)
  })

  // Pack scanlines with filter byte 0
  const raw = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1)
    raw[rowStart] = 0
    pixels.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}
