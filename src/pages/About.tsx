import { Link } from 'react-router-dom'

export function About() {
  return (
    <div className="about-page">
      <section>
        <h2>About Barcodex</h2>
        <p>
          Barcodex is a browser-based barcode and QR code generator for sample tracking,
          biobanking, and LIMS workflows. It supports Data Matrix, QR codes, Code 128,
          Code 39, EAN-13, and GS1-128 — all generated entirely in your browser using the{' '}
          <a href="https://bwip-js.metafloor.com/" target="_blank" rel="noopener noreferrer">
            bwip-js
          </a>{' '}
          library.
        </p>
        <div className="privacy-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>
            No data leaves your machine — all barcode generation happens client-side.
            Your sample IDs, URLs, and labels stay private.
          </p>
        </div>
      </section>

      <section>
        <h2>Features</h2>
        <ul>
          <li>Six barcode formats: Data Matrix, QR Code, Code 128, Code 39, EAN-13, GS1-128</li>
          <li>Single barcode mode with PNG, SVG, and PDF label export</li>
          <li>Batch mode — generate hundreds of barcodes from a list or CSV file</li>
          <li>ZIP archive or multi-page PDF download for batch output</li>
          <li>Configurable label text, font size, and dimensions</li>
          <li>All generation in-browser — no upload, no server</li>
        </ul>
      </section>

      <section>
        <h2>Supported Formats</h2>
        <p>
          <strong>Data Matrix</strong> — The ISO standard for lab sample tracking. Used on
          cryovials, microtubes, and 96-well plates. Encodes up to 2,335 characters in a
          compact square or rectangular symbol.
        </p>
        <p>
          <strong>QR Code</strong> — General-purpose 2D code scannable by any smartphone
          camera. Ideal for linking physical samples to online records, ELNs, or dashboards.
        </p>
        <p>
          <strong>Code 128</strong> — The most versatile 1D barcode. Supports all ASCII
          characters and is the default for LIMS sample IDs and equipment asset tags.
        </p>
        <p>
          <strong>Code 39</strong> — A legacy 1D format widely supported in healthcare and
          older LIMS systems. Supports uppercase letters, digits, and a handful of symbols.
        </p>
        <p>
          <strong>EAN-13</strong> — International Article Number used on reagent kits and
          commercial lab consumables.
        </p>
        <p>
          <strong>GS1-128</strong> — Supply-chain standard for encoding lot numbers,
          expiry dates, and GTINs in a single barcode using GS1 application identifiers.
        </p>
      </section>

      <section>
        <h2>Technology</h2>
        <ul>
          <li><strong>bwip-js</strong> — barcode rendering engine</li>
          <li><strong>jsPDF</strong> — PDF generation</li>
          <li><strong>JSZip</strong> — batch ZIP archive creation</li>
          <li><strong>React + Vite</strong> — frontend framework</li>
          <li><strong>Cloudflare Pages</strong> — global CDN hosting</li>
        </ul>
      </section>

      <section>
        <h2>Source Code</h2>
        <p>
          Barcodex is open-source software. Contributions and issues welcome on{' '}
          <a href="https://github.com/genomicx/barcodex" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>.
        </p>
      </section>

      <section>
        <h2>About the Author</h2>
        <h3>Nabil-Fareed Alikhan</h3>
        <p className="about-role">
          Senior Bioinformatician, Centre for Genomic Pathogen Surveillance, University of Oxford
        </p>
        <p>
          Bioinformatics researcher and software developer specialising in microbial genomics.
          Builder of widely used open-source tools, peer-reviewed researcher, and co-host of
          the MicroBinfie podcast.
        </p>
        <div className="about-links">
          <a href="https://www.happykhan.com" target="_blank" rel="noopener noreferrer">happykhan.com</a>
          <a href="https://orcid.org/0000-0002-1243-0767" target="_blank" rel="noopener noreferrer">ORCID: 0000-0002-1243-0767</a>
          <a href="mailto:nabil@happykhan.com">nabil@happykhan.com</a>
          <a href="https://twitter.com/happy_khan" target="_blank" rel="noopener noreferrer">@happy_khan</a>
          <a href="https://mstdn.science/@happykhan" target="_blank" rel="noopener noreferrer">@happykhan@mstdn.science</a>
        </div>
      </section>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/" style={{ color: 'var(--gx-accent)', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Application
        </Link>
      </div>
    </div>
  )
}
