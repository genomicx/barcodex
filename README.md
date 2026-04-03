# Barcodex

> Browser-based barcode and QR code generator for lab sample tracking — no server required.

Barcodex generates Data Matrix, QR codes, Code 128, Code 39, EAN-13, and GS1-128 barcodes entirely in your browser. Single or batch mode, with print-ready PDF label export and ZIP archives for batch output. Your sample IDs, URLs, and labels stay private — no data leaves your machine.

## Features

- Six barcode formats: Data Matrix, QR Code, Code 128, Code 39, EAN-13, GS1-128
- Single barcode mode with PNG, SVG, and PDF label export
- Batch mode — generate hundreds of barcodes from a list or CSV file
- ZIP archive or multi-page PDF download for batch output
- Configurable label text, font size, and dimensions
- All generation in-browser — no upload, no server

## Tech Stack

- **bwip-js** — barcode rendering engine (100+ formats)
- **jsPDF** — PDF generation
- **JSZip** — batch ZIP archive creation
- **React + Vite** — frontend framework
- **Cloudflare Pages** — global CDN hosting

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Running Tests

```bash
npm test           # unit tests
npm run test:e2e   # end-to-end tests (requires build first)
```

## Contributing

Contributions welcome. Please open an issue first to discuss changes.

## License

MIT — see [LICENSE](LICENSE)
