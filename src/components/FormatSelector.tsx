import { GROUPS, get } from '../barcodex/barcodes'

interface FormatSelectorProps {
  value: string
  onChange: (formatId: string) => void
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="format-row">
      <label htmlFor="format-select">Format</label>
      <select
        id="format-select"
        className="gx-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {GROUPS.map((group) => (
          <optgroup key={group.id} label={group.label}>
            {group.formats.map((fmtId) => {
              const fmt = get(fmtId)
              if (!fmt) return null
              return (
                <option key={fmtId} value={fmtId}>
                  {fmt.name} — {fmt.description}
                </option>
              )
            })}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
