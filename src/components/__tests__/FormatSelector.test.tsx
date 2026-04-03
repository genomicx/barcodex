import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FormatSelector } from '../FormatSelector'
import { GROUPS, get } from '../../barcodex/barcodes'

describe('FormatSelector', () => {
  it('renders a select element', () => {
    render(<FormatSelector value="qrcode" onChange={() => {}} />)
    expect(screen.getByLabelText('Format')).toBeInTheDocument()
  })

  it('renders all format groups as optgroups', () => {
    render(<FormatSelector value="qrcode" onChange={() => {}} />)
    for (const group of GROUPS) {
      expect(screen.getByRole('group', { name: group.label })).toBeInTheDocument()
    }
  })

  it('renders all format options', () => {
    render(<FormatSelector value="qrcode" onChange={() => {}} />)
    for (const group of GROUPS) {
      for (const fmtId of group.formats) {
        const fmt = get(fmtId)!
        // option text is "Name — description"
        expect(screen.getByText(new RegExp(fmt.name))).toBeInTheDocument()
      }
    }
  })

  it('calls onChange with the new format id when changed', () => {
    const onChange = vi.fn()
    render(<FormatSelector value="qrcode" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'datamatrix' } })
    expect(onChange).toHaveBeenCalledWith('datamatrix')
  })

  it('has the correct value selected', () => {
    render(<FormatSelector value="code128" onChange={() => {}} />)
    const select = screen.getByLabelText('Format') as HTMLSelectElement
    expect(select.value).toBe('code128')
  })
})
