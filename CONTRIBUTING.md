# Contributing to Barcodex

Thanks for your interest in contributing to Barcodex.

## Getting started

1. Fork the repository
2. Clone your fork
3. Open `index.html` in a browser — no build step needed
4. Make your changes and test locally

## Guidelines

- Keep it simple — no build tools, no frameworks, vanilla JS
- Follow the existing code style and `gx-` CSS naming convention
- Test across light and dark themes
- Test on mobile viewports
- Make sure all 6 barcode formats still render correctly

## Reporting bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Browser and OS
- Screenshot if relevant

## Adding a barcode format

1. Add the format definition to `js/barcodes.js` (follow the existing pattern)
2. Add a placeholder to `Barcodes.getPlaceholder()`
3. If the format is 2D, add its ID to the `IS_2D` set in `js/renderer.js`
4. Test single and batch mode, all export formats

## Pull requests

- Keep PRs focused on a single change
- Describe what you changed and why
