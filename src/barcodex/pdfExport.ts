/**
 * PDF export with label presets and grid layout.
 * Uses jsPDF for client-side PDF generation.
 */

import { jsPDF } from 'jspdf'
import type { FormatDef } from './barcodes'
import { toCanvas } from './renderer'

export interface LabelPreset {
  id: string
  name: string
  width: number
  height: number
  padding: number
}

export interface PDFOptions {
  preset: string
  pageSize: string
  orientation: 'portrait' | 'landscape'
  labelWidth?: number
  labelHeight?: number
  gap?: number
  margin?: number
}

// Label presets in mm
export const PRESETS: Record<string, LabelPreset> = {
  cryovial_cap: {
    id: 'cryovial_cap',
    name: 'Cryovial Cap (12mm)',
    width: 12,
    height: 12,
    padding: 1,
  },
  tube_side: {
    id: 'tube_side',
    name: 'Tube Side (25x10mm)',
    width: 25,
    height: 10,
    padding: 1,
  },
  slide_label: {
    id: 'slide_label',
    name: 'Slide Label (25x12mm)',
    width: 25,
    height: 12,
    padding: 1,
  },
  medium_label: {
    id: 'medium_label',
    name: 'Medium Label (40x20mm)',
    width: 40,
    height: 20,
    padding: 2,
  },
  large_label: {
    id: 'large_label',
    name: 'Large Label (60x30mm)',
    width: 60,
    height: 30,
    padding: 2,
  },
  full_page: {
    id: 'full_page',
    name: 'Full Page (1 per page)',
    width: 0, // computed from page size
    height: 0,
    padding: 10,
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    width: 30,
    height: 15,
    padding: 2,
  },
}

/**
 * Generate a PDF with barcodes in a grid layout.
 */
export async function generate(
  values: string[],
  formatDef: FormatDef,
  userOpts: Record<string, string>,
  showText: boolean,
  pdfOpts: PDFOptions,
): Promise<jsPDF> {
  const orientation = pdfOpts.orientation || 'portrait'
  const pageSize = pdfOpts.pageSize || 'a4'
  const gap = pdfOpts.gap ?? 2
  const pageMargin = pdfOpts.margin ?? 10

  const doc = new jsPDF({ orientation, unit: 'mm', format: pageSize })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Determine label size
  let labelW: number, labelH: number, labelPad: number
  const preset = PRESETS[pdfOpts.preset]

  if (pdfOpts.preset === 'full_page') {
    labelW = pageW - pageMargin * 2
    labelH = pageH - pageMargin * 2
    labelPad = preset.padding
  } else if (pdfOpts.preset === 'custom') {
    labelW = pdfOpts.labelWidth ?? 30
    labelH = pdfOpts.labelHeight ?? 15
    labelPad = 2
  } else {
    labelW = preset.width
    labelH = preset.height
    labelPad = preset.padding
  }

  // Calculate grid
  const usableW = pageW - pageMargin * 2
  const usableH = pageH - pageMargin * 2
  const cols =
    pdfOpts.preset === 'full_page' ? 1 : Math.floor((usableW + gap) / (labelW + gap))
  const rows =
    pdfOpts.preset === 'full_page' ? 1 : Math.floor((usableH + gap) / (labelH + gap))
  const perPage = cols * rows

  // Filter valid values
  const validValues = values.filter((v) => !formatDef.validate(v))

  for (let i = 0; i < validValues.length; i++) {
    if (i > 0 && i % perPage === 0) {
      doc.addPage()
    }

    const pageIdx = i % perPage
    const col = pageIdx % cols
    const row = Math.floor(pageIdx / cols)

    const x = pageMargin + col * (labelW + gap)
    const y = pageMargin + row * (labelH + gap)

    try {
      // Render barcode at high resolution
      const canvas = toCanvas(formatDef, validValues[i], userOpts, showText, 8)

      // Fit barcode into label cell with padding
      const barcodeArea = {
        x: x + labelPad,
        y: y + labelPad,
        w: labelW - labelPad * 2,
        h: labelH - labelPad * 2,
      }

      const aspect = canvas.width / canvas.height
      let drawW: number, drawH: number
      if (aspect >= barcodeArea.w / barcodeArea.h) {
        drawW = barcodeArea.w
        drawH = barcodeArea.w / aspect
      } else {
        drawH = barcodeArea.h
        drawW = barcodeArea.h * aspect
      }

      // Center in cell
      const drawX = barcodeArea.x + (barcodeArea.w - drawW) / 2
      const drawY = barcodeArea.y + (barcodeArea.h - drawH) / 2

      const imgData = canvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH)
    } catch {
      // Skip failed barcodes
    }
  }

  return doc
}

/**
 * Generate and download the PDF.
 */
export async function download(
  values: string[],
  formatDef: FormatDef,
  userOpts: Record<string, string>,
  showText: boolean,
  pdfOpts: PDFOptions,
): Promise<void> {
  const doc = await generate(values, formatDef, userOpts, showText, pdfOpts)
  const formatName = formatDef.name.replace(/\s+/g, '-').toLowerCase()
  doc.save(`barcodes-${formatName}.pdf`)
}

export function getPresets(): Record<string, LabelPreset> {
  return PRESETS
}
