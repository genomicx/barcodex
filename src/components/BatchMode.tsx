import { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { FormatDef } from '../barcodex/barcodes'
import { parseInput, validateAll, generateAll, exportZIP, exportZipSVG } from '../barcodex/batch'
import type { BatchResult, BatchInvalid } from '../barcodex/batch'
import { download as pdfDownload } from '../barcodex/pdfExport'
import type { PDFOptions } from '../barcodex/pdfExport'
import { PdfSettings } from './PdfSettings'

interface BatchModeProps {
  formatDef: FormatDef
  userOpts: Record<string, string>
  showText: boolean
}

const BATCH_PLACEHOLDERS: Record<string, string> = {
  datamatrix: 'SAMP-2025-00142\nSAMP-2025-00143\nSAMP-2025-00144',
  qrcode: 'https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3',
  code128: 'LAB-CRYO-00837\nLAB-CRYO-00838\nLAB-CRYO-00839',
  code39: 'PLATE A3 R7\nPLATE A3 R8\nPLATE A3 R9',
  ean13: '5901234123457\n5901234123464\n5901234123471',
  gs1_128:
    '(01)09501101530003(17)260101\n(01)09501101530003(17)260201\n(01)09501101530003(17)260301',
}

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

type AllItem = (BatchResult & { type: 'valid' | 'error' }) | (BatchInvalid & { type: 'invalid' })

export function BatchMode({ formatDef, userOpts, showText }: BatchModeProps) {
  const [inputText, setInputText] = useState('')
  const [allItems, setAllItems] = useState<AllItem[]>([])
  const [validCount, setValidCount] = useState(0)
  const [pdfOpts, setPdfOpts] = useState<PDFOptions>(DEFAULT_PDF_OPTS)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [zipPngLoading, setZipPngLoading] = useState(false)
  const [zipSvgLoading, setZipSvgLoading] = useState(false)
  const [dragover, setDragover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const processInput = useCallback(
    (text: string) => {
      const values = parseInput(text)
      if (!values.length) {
        setAllItems([])
        setValidCount(0)
        return
      }

      const { valid, invalid } = validateAll(values, formatDef)
      const results = generateAll(valid, formatDef, userOpts, showText)

      const items: AllItem[] = [
        ...results.map((r) => ({ ...r, type: (r.error ? 'error' : 'valid') as 'valid' | 'error' })),
        ...invalid.map((inv) => ({ ...inv, type: 'invalid' as const })),
      ].sort((a, b) => a.index - b.index)

      setAllItems(items)
      setValidCount(valid.length)
    },
    [formatDef, userOpts, showText],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => processInput(inputText), 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputText, processInput])

  async function handleLoadFile(file: File) {
    if (!/\.(txt|csv|tsv)$/.test(file.name)) {
      toast.error('Please upload a .txt, .csv, or .tsv file')
      return
    }
    try {
      const { readFile } = await import('../barcodex/batch')
      const content = await readFile(file)
      setInputText(content)
    } catch (e) {
      toast.error('Failed to read file: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const validValues = parseInput(inputText).filter((v) => !formatDef.validate(v))

  async function handlePDF() {
    if (!validValues.length) return
    setPdfLoading(true)
    try {
      await pdfDownload(validValues, formatDef, userOpts, showText, pdfOpts)
    } catch (e) {
      toast.error('PDF export failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleZipPNG() {
    if (!validValues.length) return
    setZipPngLoading(true)
    try {
      const blob = await exportZIP(validValues, formatDef, userOpts, showText, 512)
      downloadBlob(blob, `barcodes-${formatDef.id}-png.zip`)
    } catch (e) {
      toast.error('ZIP export failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setZipPngLoading(false)
    }
  }

  async function handleZipSVG() {
    if (!validValues.length) return
    setZipSvgLoading(true)
    try {
      const blob = await exportZipSVG(validValues, formatDef, userOpts, showText)
      downloadBlob(blob, `barcodes-${formatDef.id}-svg.zip`)
    } catch (e) {
      toast.error('ZIP export failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setZipSvgLoading(false)
    }
  }

  return (
    <div>
      <textarea
        className="gx-input batch-textarea"
        placeholder={BATCH_PLACEHOLDERS[formatDef.id] ?? 'VALUE-001\nVALUE-002\nVALUE-003'}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        aria-label="Batch values, one per line"
      />

      <div
        className={`batch-drop${dragover ? ' dragover' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Drop a CSV, TSV, or TXT file here or click to browse"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragover(false)
          if (e.dataTransfer.files[0]) handleLoadFile(e.dataTransfer.files[0])
        }}
      >
        Drop a .txt / .csv / .tsv file here, or click to browse
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.tsv"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) handleLoadFile(e.target.files[0])
          e.target.value = ''
        }}
      />

      {inputText && (
        <p className="batch-count">
          {parseInput(inputText).length} items ({validCount} valid)
        </p>
      )}

      {allItems.length > 0 && (
        <BatchGrid items={allItems} />
      )}

      {validCount > 0 && (
        <div className="export-panel">
          <h3>Export</h3>
          <div className="export-buttons">
            <button
              className="gx-btn gx-btn-sm"
              onClick={handleZipPNG}
              disabled={zipPngLoading}
            >
              {zipPngLoading ? 'Generating...' : 'ZIP (PNG)'}
            </button>
            <button
              className="gx-btn gx-btn-sm"
              onClick={handleZipSVG}
              disabled={zipSvgLoading}
            >
              {zipSvgLoading ? 'Generating...' : 'ZIP (SVG)'}
            </button>
            <button
              className="gx-btn gx-btn-sm"
              onClick={handlePDF}
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
          <PdfSettings options={pdfOpts} onChange={setPdfOpts} />
        </div>
      )}
    </div>
  )
}

function BatchGrid({ items }: { items: AllItem[] }) {
  return (
    <div className="batch-grid">
      {items.map((item) => (
        <BatchCard key={item.index} item={item} />
      ))}
    </div>
  )
}

function BatchCard({ item }: { item: AllItem }) {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = canvasRef.current
    if (!container) return
    container.innerHTML = ''
    if (item.type === 'valid' && item.canvas) {
      const canvas = item.canvas as HTMLCanvasElement
      canvas.style.maxWidth = '100%'
      canvas.style.height = 'auto'
      canvas.style.imageRendering = 'pixelated'
      container.appendChild(canvas)
    }
  }, [item])

  if (item.type === 'invalid' || item.type === 'error') {
    return (
      <div className="batch-card error">
        <div className="batch-card-preview batch-card-error-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ fontSize: '0.65rem' }}>{(item as BatchResult).error ?? (item as BatchInvalid).error ?? 'Failed'}</span>
        </div>
        <div className="batch-card-label" title={item.value}>{item.value}</div>
      </div>
    )
  }

  return (
    <div className="batch-card">
      <div className="batch-card-preview" ref={canvasRef} />
      <div className="batch-card-label" title={item.value}>{item.value}</div>
    </div>
  )
}
