import { useState } from 'react'
import { PRESETS } from '../barcodex/pdfExport'
import type { PDFOptions } from '../barcodex/pdfExport'

interface PdfSettingsProps {
  options: PDFOptions
  onChange: (opts: PDFOptions) => void
}

export function PdfSettings({ options, onChange }: PdfSettingsProps) {
  const [open, setOpen] = useState(false)

  function update(patch: Partial<PDFOptions>) {
    onChange({ ...options, ...patch })
  }

  return (
    <div className="pdf-settings">
      <button
        type="button"
        className="pdf-settings-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>PDF Label Settings</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="14"
          height="14"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      <div className={`pdf-settings-body${open ? ' open' : ''}`}>
        <div className="pdf-settings-row">
          <div className="pdf-settings-field">
            <label htmlFor="pdf-preset">Label Preset</label>
            <select
              id="pdf-preset"
              className="gx-select"
              value={options.preset}
              onChange={(e) => update({ preset: e.target.value })}
            >
              {Object.values(PRESETS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pdf-settings-field">
            <label htmlFor="pdf-page-size">Page Size</label>
            <select
              id="pdf-page-size"
              className="gx-select"
              value={options.pageSize}
              onChange={(e) => update({ pageSize: e.target.value })}
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="a3">A3</option>
            </select>
          </div>

          <div className="pdf-settings-field">
            <label htmlFor="pdf-orientation">Orientation</label>
            <select
              id="pdf-orientation"
              className="gx-select"
              value={options.orientation}
              onChange={(e) => update({ orientation: e.target.value as 'portrait' | 'landscape' })}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        {options.preset === 'custom' && (
          <div className="pdf-settings-row">
            <div className="pdf-settings-field">
              <label htmlFor="pdf-custom-w">Label Width (mm)</label>
              <input
                id="pdf-custom-w"
                type="number"
                className="gx-input"
                min="5"
                max="200"
                value={options.labelWidth ?? 30}
                onChange={(e) => update({ labelWidth: parseFloat(e.target.value) || 30 })}
              />
            </div>
            <div className="pdf-settings-field">
              <label htmlFor="pdf-custom-h">Label Height (mm)</label>
              <input
                id="pdf-custom-h"
                type="number"
                className="gx-input"
                min="5"
                max="200"
                value={options.labelHeight ?? 15}
                onChange={(e) => update({ labelHeight: parseFloat(e.target.value) || 15 })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
