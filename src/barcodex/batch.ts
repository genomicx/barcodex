/**
 * Batch barcode generation from text files or pasted lists.
 */

import JSZip from 'jszip'
import type { FormatDef } from './barcodes'
import { toPreview, toSizedCanvas, toSVG } from './renderer'

export interface BatchItem {
  index: number
  value: string
}

export interface BatchResult {
  index: number
  value: string
  canvas: HTMLCanvasElement | null
  error?: string
}

export interface BatchInvalid {
  index: number
  value: string
  error: string
}

/**
 * Parse input text into an array of values.
 * Splits by newline, trims whitespace, removes empty lines.
 */
export function parseInput(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/**
 * Read a text file and return its contents.
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Validate all values against a format and return results.
 */
export function validateAll(
  values: string[],
  formatDef: FormatDef,
): { valid: BatchItem[]; invalid: BatchInvalid[] } {
  const valid: BatchItem[] = []
  const invalid: BatchInvalid[] = []

  values.forEach((value, index) => {
    const error = formatDef.validate(value)
    if (error) {
      invalid.push({ index, value, error })
    } else {
      valid.push({ index, value })
    }
  })

  return { valid, invalid }
}

/**
 * Generate barcode canvases for all valid values.
 */
export function generateAll(
  items: BatchItem[],
  formatDef: FormatDef,
  userOpts: Record<string, string>,
  showText: boolean,
): BatchResult[] {
  const results: BatchResult[] = []

  for (const item of items) {
    try {
      const canvas = toPreview(formatDef, item.value, userOpts, showText)
      results.push({ index: item.index, value: item.value, canvas })
    } catch (e) {
      results.push({
        index: item.index,
        value: item.value,
        canvas: null,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return results
}

/**
 * Export all barcodes as individual PNG files in a ZIP.
 */
export async function exportZIP(
  values: string[],
  formatDef: FormatDef,
  userOpts: Record<string, string>,
  showText: boolean,
  size: number,
): Promise<Blob> {
  const zip = new JSZip()

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const error = formatDef.validate(value)
    if (error) continue

    try {
      const canvas = toSizedCanvas(formatDef, value, size, userOpts, showText)
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
      const safeName = value.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
      zip.file(`${String(i + 1).padStart(4, '0')}_${safeName}.png`, blob)
    } catch {
      // Skip failed barcodes
    }
  }

  return zip.generateAsync({ type: 'blob' })
}

/**
 * Export all barcodes as individual SVG files in a ZIP.
 */
export async function exportZipSVG(
  values: string[],
  formatDef: FormatDef,
  userOpts: Record<string, string>,
  showText: boolean,
): Promise<Blob> {
  const zip = new JSZip()

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const error = formatDef.validate(value)
    if (error) continue

    try {
      const svg = toSVG(formatDef, value, userOpts, showText)
      const safeName = value.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
      zip.file(`${String(i + 1).padStart(4, '0')}_${safeName}.svg`, svg)
    } catch {
      // Skip failed
    }
  }

  return zip.generateAsync({ type: 'blob' })
}
