import { useState } from 'react'
import { get, getPlaceholder } from '../barcodex/barcodes'
import { FormatSelector } from '../components/FormatSelector'
import { SingleMode } from '../components/SingleMode'
import { BatchMode } from '../components/BatchMode'

type Mode = 'single' | 'batch'

const DEMO_SAMPLES: Record<string, string> = {
  datamatrix: 'SAMP-2025-00142',
  qrcode: 'https://genomicx.vercel.app',
  code128: 'LAB-CRYO-00837',
  code39: 'PLATE A3 R7',
  ean13: '590210105300',
  gs1_128: '(01)09501101530003(17)260101',
}

export function BarcodeGenerator() {
  const [formatId, setFormatId] = useState('qrcode')
  const [mode, setMode] = useState<Mode>('single')
  const [showText, setShowText] = useState(() => {
    const fmt = get('qrcode')
    return fmt?.showTextDefault ?? false
  })
  const [userOpts, setUserOpts] = useState<Record<string, string>>({})
  const [demoKey, setDemoKey] = useState(0)

  const formatDef = get(formatId)!

  function handleFormatChange(id: string) {
    const fmt = get(id)
    if (!fmt) return
    setFormatId(id)
    setShowText(fmt.showTextDefault)
    // Reset format-specific options to defaults
    const defaults: Record<string, string> = {}
    for (const opt of fmt.options) {
      defaults[opt.id] = opt.default
    }
    setUserOpts(defaults)
  }

  function handleUserOptChange(id: string, value: string) {
    setUserOpts((prev) => ({ ...prev, [id]: value }))
  }

  // Trigger a demo by updating a key that resets SingleMode with demo value
  void demoKey
  void DEMO_SAMPLES
  void getPlaceholder

  return (
    <div>
      <div className="generator-section">
        <FormatSelector value={formatId} onChange={handleFormatChange} />

        {/* Format-specific options */}
        {formatDef.options.length > 0 && (
          <div className="format-options">
            {formatDef.options.map((optDef) => (
              <div key={optDef.id}>
                <label htmlFor={`opt-${optDef.id}`}>{optDef.label}</label>
                {optDef.tooltip && (
                  <span
                    title={optDef.tooltip}
                    style={{ marginLeft: '0.25rem', cursor: 'help', fontSize: '0.75rem', color: 'var(--gx-text-muted)' }}
                  >
                    (?)
                  </span>
                )}
                <select
                  id={`opt-${optDef.id}`}
                  className="gx-select"
                  value={userOpts[optDef.id] ?? optDef.default}
                  onChange={(e) => handleUserOptChange(optDef.id, e.target.value)}
                >
                  {optDef.choices.map((ch) => (
                    <option key={ch.value} value={ch.value}>
                      {ch.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="show-text-row">
          <input
            type="checkbox"
            id="show-text"
            checked={showText}
            onChange={(e) => setShowText(e.target.checked)}
          />
          <label htmlFor="show-text">Show human-readable text</label>
        </div>
      </div>

      <div className="mode-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'single'}
          className={`mode-tab${mode === 'single' ? ' active' : ''}`}
          onClick={() => setMode('single')}
        >
          Single
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'batch'}
          className={`mode-tab${mode === 'batch' ? ' active' : ''}`}
          onClick={() => setMode('batch')}
        >
          Batch
        </button>
        <button
          type="button"
          className="mode-tab"
          onClick={() => {
            setMode('single')
            setDemoKey((k) => k + 1)
          }}
          aria-label="Load demo value"
        >
          Demo
        </button>
      </div>

      {mode === 'single' ? (
        <SingleMode
          key={`${formatId}-${demoKey}`}
          formatDef={formatDef}
          userOpts={userOpts}
          showText={showText}
        />
      ) : (
        <BatchMode
          key={formatId}
          formatDef={formatDef}
          userOpts={userOpts}
          showText={showText}
        />
      )}
    </div>
  )
}
