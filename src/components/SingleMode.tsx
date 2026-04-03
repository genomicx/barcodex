import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { FormatDef } from '../barcodex/barcodes'
import { getPlaceholder } from '../barcodex/barcodes'
import { toSVG, toSizedCanvas } from '../barcodex/renderer'
import { download as pdfDownload } from '../barcodex/pdfExport'
import type { PDFOptions } from '../barcodex/pdfExport'
import { BarcodePreview } from './BarcodePreview'
import { PdfSettings } from './PdfSettings'

interface SingleModeProps {
  formatDef: FormatDef
  userOpts: Record<string, string>
  showText: boolean
}

const EXPORT_SIZES = [256, 512, 1024, 2048]

const DEFAULT_PDF_OPTS: PDFOptions = {
  preset: 'medium_label',
  pageSize: 'a4',
  orientation: 'portrait',
  labelWidth: 30,
  labelHeight: 15,
  gap: 2,
  margin: 10,
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function SingleMode({ formatDef, userOpts, showText }: SingleModeProps) {
  const [text, setText] = useState('')
  const [pdfOpts, setPdfOpts] = useState<PDFOptions>(DEFAULT_PDF_OPTS)

  const isValid = text.trim() !== '' && !formatDef.validate(text.trim())

  const handleExportSVG = useCallback(() => {
    const t = text.trim()
    if (!isValid) return
    try {
      const svg = toSVG(formatDef, t, userOpts, showText)
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `barcode-${formatDef.id}.svg`)
    } catch (e) {
      toast.error('Export failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }, [text, isValid, formatDef, userOpts, showText])

  const handleExportRaster = useCallback(
    (format: 'png' | 'jpg', size: number) => {
      const t = text.trim()
      if (!isValid) return
      try {
        const canvas = toSizedCanvas(formatDef, t, size, userOpts, showText)
        const mime = format === 'png' ? 'image/png' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            if (blob) downloadBlob(blob, `barcode-${formatDef.id}-${size}.${format}`)
          },
          mime,
          format === 'jpg' ? 0.95 : undefined,
        )
      } catch (e) {
        toast.error('Export failed: ' + (e instanceof Error ? e.message : String(e)))
      }
    },
    [text, isValid, formatDef, userOpts, showText],
  )

  const handleExportPDF = useCallback(async () => {
    const t = text.trim()
    if (!isValid) return
    try {
      await pdfDownload([t], formatDef, userOpts, showText, pdfOpts)
    } catch (e) {
      toast.error('PDF export failed: ' + (e instanceof Error ? e.message : String(e)))
    }
  }, [text, isValid, formatDef, userOpts, showText, pdfOpts])

  return (
    <div>
      <div className="input-group">
        <input
          type="text"
          className="gx-input"
          style={{ width: '100%' }}
          placeholder={getPlaceholder(formatDef.id)}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Barcode value"
        />
      </div>
      <div className="char-count">{text.length} characters</div>

      <BarcodePreview
        formatDef={formatDef}
        text={text.trim()}
        userOpts={userOpts}
        showText={showText}
      />

      {isValid && (
        <div className="export-panel">
          <h3>Export</h3>
          <div className="export-buttons">
            <button className="gx-btn gx-btn-sm" onClick={handleExportSVG}>
              SVG
            </button>
            {EXPORT_SIZES.map((s) => (
              <button
                key={`png-${s}`}
                className="gx-btn gx-btn-sm"
                onClick={() => handleExportRaster('png', s)}
              >
                PNG {s}px
              </button>
            ))}
            <button className="gx-btn gx-btn-sm" onClick={handleExportPDF}>
              PDF Label
            </button>
          </div>
          <PdfSettings options={pdfOpts} onChange={setPdfOpts} />
        </div>
      )}
    </div>
  )
}
