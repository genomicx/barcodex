import { useEffect, useRef } from 'react'
import type { FormatDef } from '../barcodex/barcodes'
import { toPreview } from '../barcodex/renderer'

interface BarcodePreviewProps {
  formatDef: FormatDef
  text: string
  userOpts: Record<string, string>
  showText: boolean
}

export function BarcodePreview({ formatDef, text, userOpts, showText }: BarcodePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear previous content
    container.innerHTML = ''

    if (!text) return

    const error = formatDef.validate(text)
    if (error) {
      const div = document.createElement('div')
      div.className = 'preview-error'
      div.textContent = error
      container.appendChild(div)
      return
    }

    try {
      const canvas = toPreview(formatDef, text, userOpts, showText)
      canvas.style.maxWidth = '100%'
      canvas.style.height = 'auto'
      canvas.style.imageRendering = 'pixelated'
      container.appendChild(canvas)
    } catch (e) {
      const div = document.createElement('div')
      div.className = 'preview-error'
      div.textContent = e instanceof Error ? e.message : String(e)
      container.appendChild(div)
    }
  }, [formatDef, text, userOpts, showText])

  return (
    <div className="preview-area">
      {!text && (
        <p className="preview-placeholder">Enter a value above to generate a barcode</p>
      )}
      <div ref={containerRef} style={{ display: text ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }} />
    </div>
  )
}
