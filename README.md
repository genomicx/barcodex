# barcodex

Browser-based barcode generator for lab sample tracking, biobanking, and LIMS workflows. Generate Data Matrix, QR codes, Code 128, and more — single or batch — with print-ready PDF label export. Everything runs client-side; your data never leaves the browser.

**Live:** [barcodex.vercel.app](https://barcodex.vercel.app)

## Features

- **6 barcode formats** — Data Matrix, QR Code, Code 128, Code 39, EAN-13, GS1-128
- **Single mode** — type a value, see a live preview, export as SVG, PDF, PNG, or JPG
- **Batch mode** — upload a `.txt` file or paste a list (one value per line), preview all barcodes, export as PDF label sheet or ZIP of individual files
- **PDF label export** — presets for cryovial caps, tube sides, slide labels, or custom dimensions; auto grid-packing on A4/Letter
- **Human-readable text** — toggle captions below barcodes (works for both 1D and 2D formats)
- **No expiry** — barcodes encode your data directly, no server redirects that can break
- **Fully private** — no uploads, no analytics, no tracking; pure client-side JavaScript

## Supported formats

| Format | Type | Use case |
|--------|------|----------|
| Data Matrix | 2D | Cryovials, tubes, 96-well plates, slides |
| QR Code | 2D | General purpose, phone-scannable |
| Code 128 | 1D | LIMS sample IDs, equipment asset tags |
| Code 39 | 1D | Legacy LIMS and healthcare tracking |
| EAN-13 | 1D | Reagent, kit, and product identification |
| GS1-128 | 1D | Supply chain — lot, expiry, GTIN |

## Tech stack

- Vanilla HTML, CSS, JavaScript — no build step, no framework
- [bwip-js](https://github.com/metafloor/bwip-js) — barcode rendering (100+ formats)
- [jsPDF](https://github.com/parallax/jsPDF) — client-side PDF generation
- [JSZip](https://stuk.github.io/jszip/) — ZIP file creation for batch export
- [GenomicX design system](https://github.com/genomicx/genomicx.github.io/tree/main/front-end-template) — theming and components

## Project structure

```
barcodex/
├── index.html          # Single-page app
├── css/
│   └── genomicx.css    # Design system stylesheet
├── js/
│   ├── genomicx.js     # Theme toggle, nav
│   ├── barcodes.js     # Format definitions, validation, options
│   ├── renderer.js     # bwip-js wrapper, canvas/SVG output, captions
│   ├── batch.js        # Text file parsing, batch generation, ZIP export
│   ├── pdf-export.js   # PDF layout, label presets, grid packing
│   └── app.js          # UI wiring, mode switching, event handlers
└── vercel.json         # Deployment config
```

## Development

No build step required. Open `index.html` in a browser or serve locally:

```bash
npx serve .
```

## Deploy

```bash
npx vercel --prod
```

## Part of GenomicX

This app is part of the [GenomicX](https://genomicx.vercel.app) suite of browser-based bioinformatics tools.

## License

[MIT](LICENSE)
