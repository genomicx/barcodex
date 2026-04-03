import { Routes, Route } from 'react-router-dom'
import { NavBar, AppFooter } from '@genomicx/ui'
import { useEffect } from 'react'
import { BarcodeGenerator } from './pages/BarcodeGenerator'
import { About } from './pages/About'
import { APP_VERSION } from './lib/version'

export default function App() {
  useEffect(() => {
    const saved = (localStorage.getItem('gx-theme') as 'light' | 'dark') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <div className="app">
      <NavBar appName="BARCODEX" appSubtitle="Barcode & QR code generator" version={APP_VERSION} githubUrl="https://github.com/genomicx/barcodex" icon={
        <svg className="gx-nav-logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gx-accent)" strokeWidth="2">
          {/* Barcode icon */}
          <rect x="2" y="4" width="2" height="16" fill="var(--gx-accent)" stroke="none"/>
          <rect x="6" y="4" width="1" height="16" fill="var(--gx-accent)" stroke="none"/>
          <rect x="9" y="4" width="3" height="16" fill="var(--gx-accent)" stroke="none"/>
          <rect x="14" y="4" width="1" height="16" fill="var(--gx-accent)" stroke="none"/>
          <rect x="17" y="4" width="2" height="16" fill="var(--gx-accent)" stroke="none"/>
          <rect x="21" y="4" width="1" height="16" fill="var(--gx-accent)" stroke="none"/>
        </svg>
      } />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<BarcodeGenerator />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <AppFooter appName="BARCODEX" bugReportEmail="nabil@happykhan.com" bugReportUrl="https://github.com/genomicx/barcodex/issues" />
    </div>
  )
}
