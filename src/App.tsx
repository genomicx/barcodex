import { Routes, Route } from 'react-router-dom'
import { NavBar, AppFooter } from '@genomicx/ui'
import { useEffect } from 'react'
import { BarcodeGenerator } from './pages/BarcodeGenerator'
import { About } from './pages/About'

export default function App() {
  useEffect(() => {
    const saved = (localStorage.getItem('gx-theme') as 'light' | 'dark') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <div className="app">
      <NavBar appName="BARCODEX" appSubtitle="Barcode & QR code generator" version="0.1.0" />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<BarcodeGenerator />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <AppFooter appName="BARCODEX" />
    </div>
  )
}
