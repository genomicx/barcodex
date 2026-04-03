import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BarcodeGenerator } from '../../pages/BarcodeGenerator'

// bwip-js uses canvas; mock it for jsdom
vi.mock('bwip-js', () => ({
  default: {
    toCanvas: vi.fn(),
    toSVG: vi.fn(() => '<svg></svg>'),
  },
}))

function renderGenerator() {
  return render(
    <MemoryRouter>
      <BarcodeGenerator />
    </MemoryRouter>,
  )
}

describe('BarcodeGenerator page', () => {
  it('renders format selector', () => {
    renderGenerator()
    expect(screen.getByLabelText('Format')).toBeInTheDocument()
  })

  it('renders mode tabs', () => {
    renderGenerator()
    expect(screen.getByRole('tab', { name: 'Single' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Batch' })).toBeInTheDocument()
  })

  it('renders show text checkbox', () => {
    renderGenerator()
    expect(screen.getByLabelText('Show human-readable text')).toBeInTheDocument()
  })

  it('renders single mode input by default', () => {
    renderGenerator()
    expect(screen.getByLabelText('Barcode value')).toBeInTheDocument()
  })
})
