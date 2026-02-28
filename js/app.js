/**
 * QRx — QR Code Generator
 * Application logic for generating, previewing, and exporting QR codes.
 */

const QRx = (() => {
  let currentModules = null;
  let currentModuleCount = 0;

  const EXPORT_SIZES = [256, 512, 1024, 2048];

  /* =========================================================================
     QR CODE GENERATION
     ========================================================================= */

  /**
   * Generate QR code module data from text.
   * @param {string} text - The text/URL to encode.
   * @param {string} ecl - Error correction level: 'L', 'M', 'Q', 'H'.
   * @returns {{ modules: boolean[][], count: number }} Module grid data.
   */
  function generate(text, ecl) {
    if (!text) return null;

    // Use type 0 for auto-detection of the best type number
    const qr = qrcode(0, ecl);
    qr.addData(text);
    qr.make();

    const count = qr.getModuleCount();
    const modules = [];
    for (let row = 0; row < count; row++) {
      modules[row] = [];
      for (let col = 0; col < count; col++) {
        modules[row][col] = qr.isDark(row, col);
      }
    }

    return { modules, count };
  }

  /* =========================================================================
     SVG RENDERING
     ========================================================================= */

  /**
   * Create an SVG string from module data.
   * @param {boolean[][]} modules - The QR module grid.
   * @param {number} count - Number of modules per side.
   * @param {object} [opts] - Options.
   * @param {number} [opts.margin=4] - Quiet zone in modules.
   * @param {string} [opts.fg='#0f172a'] - Foreground color.
   * @param {string} [opts.bg='#ffffff'] - Background color.
   * @returns {string} SVG markup.
   */
  function toSVG(modules, count, opts = {}) {
    const margin = opts.margin ?? 4;
    const fg = opts.fg || '#0f172a';
    const bg = opts.bg || '#ffffff';
    const size = count + margin * 2;

    let paths = '';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (modules[row][col]) {
          const x = col + margin;
          const y = row + margin;
          paths += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g fill="${fg}">${paths}</g>
</svg>`;
  }

  /* =========================================================================
     CANVAS RENDERING (for raster export)
     ========================================================================= */

  /**
   * Draw QR code onto a canvas at a given pixel size.
   * @param {boolean[][]} modules
   * @param {number} count
   * @param {number} pixelSize - Output image width/height in pixels.
   * @param {object} [opts]
   * @returns {HTMLCanvasElement}
   */
  function toCanvas(modules, count, pixelSize, opts = {}) {
    const margin = opts.margin ?? 4;
    const fg = opts.fg || '#0f172a';
    const bg = opts.bg || '#ffffff';
    const totalModules = count + margin * 2;
    const scale = pixelSize / totalModules;

    const canvas = document.createElement('canvas');
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, pixelSize, pixelSize);

    // Modules
    ctx.fillStyle = fg;
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (modules[row][col]) {
          const x = (col + margin) * scale;
          const y = (row + margin) * scale;
          ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(scale), Math.ceil(scale));
        }
      }
    }

    return canvas;
  }

  /* =========================================================================
     EXPORT HELPERS
     ========================================================================= */

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportSVG() {
    if (!currentModules) return;
    const svg = toSVG(currentModules, currentModuleCount);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, 'qrcode.svg');
  }

  function exportPNG(size) {
    if (!currentModules) return;
    const canvas = toCanvas(currentModules, currentModuleCount, size);
    canvas.toBlob(blob => {
      downloadBlob(blob, `qrcode-${size}x${size}.png`);
    }, 'image/png');
  }

  function exportJPG(size) {
    if (!currentModules) return;
    const canvas = toCanvas(currentModules, currentModuleCount, size);
    canvas.toBlob(blob => {
      downloadBlob(blob, `qrcode-${size}x${size}.jpg`);
    }, 'image/jpeg', 0.95);
  }

  /* =========================================================================
     UI LOGIC
     ========================================================================= */

  function updatePreview() {
    const input = document.getElementById('qr-input');
    const eclSelect = document.getElementById('qr-ecl');
    const preview = document.getElementById('qr-preview');
    const exportPanel = document.getElementById('qr-export');
    const placeholder = document.getElementById('qr-placeholder');
    const charCount = document.getElementById('char-count');

    const text = input.value.trim();

    // Update character count
    if (charCount) {
      charCount.textContent = `${text.length} characters`;
    }

    if (!text) {
      preview.innerHTML = '';
      if (placeholder) placeholder.style.display = '';
      if (exportPanel) exportPanel.style.display = 'none';
      currentModules = null;
      currentModuleCount = 0;
      return;
    }

    try {
      const ecl = eclSelect.value;
      const result = generate(text, ecl);
      if (!result) return;

      currentModules = result.modules;
      currentModuleCount = result.count;

      const svg = toSVG(currentModules, currentModuleCount);
      preview.innerHTML = svg;
      if (placeholder) placeholder.style.display = 'none';
      if (exportPanel) exportPanel.style.display = '';
    } catch (e) {
      preview.innerHTML = `<div class="qr-error">Text too long for this error correction level. Try a lower level or shorter text.</div>`;
      if (exportPanel) exportPanel.style.display = 'none';
      currentModules = null;
      currentModuleCount = 0;
    }
  }

  function init() {
    const input = document.getElementById('qr-input');
    const eclSelect = document.getElementById('qr-ecl');

    // Live preview on input
    input.addEventListener('input', updatePreview);
    eclSelect.addEventListener('change', updatePreview);

    // Export buttons
    document.getElementById('export-svg').addEventListener('click', exportSVG);

    EXPORT_SIZES.forEach(size => {
      const pngBtn = document.getElementById(`export-png-${size}`);
      const jpgBtn = document.getElementById(`export-jpg-${size}`);
      if (pngBtn) pngBtn.addEventListener('click', () => exportPNG(size));
      if (jpgBtn) jpgBtn.addEventListener('click', () => exportJPG(size));
    });

    // Initial state
    updatePreview();
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { generate, toSVG, toCanvas, exportSVG, exportPNG, exportJPG };
})();
