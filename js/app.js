/**
 * QRx — Main application logic.
 * Wires up UI for single and batch barcode generation.
 */

const App = (() => {

  let currentFormat = 'datamatrix';
  let currentMode = 'single';

  const EXPORT_SIZES = [256, 512, 1024, 2048];

  const $ = (id) => document.getElementById(id);

  /* =========================================================================
     FORMAT SELECTOR
     ========================================================================= */

  function buildFormatOptions() {
    const select = $('format-select');
    select.innerHTML = '';

    Barcodes.GROUPS.forEach(group => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;

      group.formats.forEach(fmtId => {
        const fmt = Barcodes.get(fmtId);
        const option = document.createElement('option');
        option.value = fmtId;
        option.textContent = `${fmt.name} — ${fmt.description}`;
        if (fmtId === currentFormat) option.selected = true;
        optgroup.appendChild(option);
      });

      select.appendChild(optgroup);
    });
  }

  function buildFormatSpecificOptions() {
    const container = $('format-options');
    container.innerHTML = '';

    const fmt = Barcodes.get(currentFormat);
    if (!fmt.options.length) return;

    fmt.options.forEach(optDef => {
      const group = document.createElement('div');
      group.className = 'gx-input-group';

      const label = document.createElement('label');
      label.className = 'gx-label';
      label.textContent = optDef.label;
      label.htmlFor = `opt-${optDef.id}`;
      group.appendChild(label);

      if (optDef.type === 'select') {
        const sel = document.createElement('select');
        sel.className = 'gx-select';
        sel.id = `opt-${optDef.id}`;
        sel.dataset.optId = optDef.id;

        optDef.choices.forEach(ch => {
          const o = document.createElement('option');
          o.value = ch.value;
          o.textContent = ch.label;
          if (ch.value === optDef.default) o.selected = true;
          sel.appendChild(o);
        });

        sel.addEventListener('change', onInputChange);
        group.appendChild(sel);
      }

      container.appendChild(group);
    });
  }

  function getFormatOptions() {
    const opts = {};
    const fmt = Barcodes.get(currentFormat);
    fmt.options.forEach(optDef => {
      const el = $(`opt-${optDef.id}`);
      if (el) opts[optDef.id] = el.value;
    });
    return opts;
  }

  /* =========================================================================
     SINGLE MODE
     ========================================================================= */

  function updateSinglePreview() {
    const fmt = Barcodes.get(currentFormat);
    const text = $('single-input').value.trim();
    const showText = $('show-text').checked;
    const preview = $('single-preview');
    const placeholder = $('single-placeholder');
    const exportPanel = $('single-export');
    const charCount = $('char-count');

    if (charCount) charCount.textContent = `${text.length} characters`;

    if (!text) {
      preview.innerHTML = '';
      placeholder.style.display = '';
      exportPanel.style.display = 'none';
      return;
    }

    const error = fmt.validate(text);
    if (error) {
      preview.innerHTML = `<div class="qr-error">${error}</div>`;
      placeholder.style.display = 'none';
      exportPanel.style.display = 'none';
      return;
    }

    try {
      const userOpts = getFormatOptions();
      const canvas = Renderer.toPreview(fmt, text, userOpts, showText);
      preview.innerHTML = '';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.style.imageRendering = 'pixelated';
      preview.appendChild(canvas);
      placeholder.style.display = 'none';
      exportPanel.style.display = '';
    } catch (e) {
      preview.innerHTML = `<div class="qr-error">${e.message}</div>`;
      placeholder.style.display = 'none';
      exportPanel.style.display = 'none';
    }
  }

  /* =========================================================================
     SINGLE EXPORT
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

  function exportSingleSVG() {
    const fmt = Barcodes.get(currentFormat);
    const text = $('single-input').value.trim();
    if (!text || fmt.validate(text)) return;

    try {
      const svg = Renderer.toSVG(fmt, text, getFormatOptions(), $('show-text').checked);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      downloadBlob(blob, `barcode-${fmt.id}.svg`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  }

  function exportSingleRaster(format, size) {
    const fmt = Barcodes.get(currentFormat);
    const text = $('single-input').value.trim();
    if (!text || fmt.validate(text)) return;

    try {
      const canvas = Renderer.toSizedCanvas(fmt, text, size, getFormatOptions(), $('show-text').checked);
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpg' ? 0.95 : undefined;
      canvas.toBlob(blob => {
        downloadBlob(blob, `barcode-${fmt.id}-${size}x${size}.${format}`);
      }, mimeType, quality);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  }

  function exportSinglePDF() {
    const fmt = Barcodes.get(currentFormat);
    const text = $('single-input').value.trim();
    if (!text || fmt.validate(text)) return;

    const pdfOpts = getPDFOptions();
    PDFExport.download([text], fmt, getFormatOptions(), $('show-text').checked, pdfOpts);
  }

  /* =========================================================================
     BATCH MODE
     ========================================================================= */

  function getBatchValues() {
    return Batch.parseInput($('batch-input').value);
  }

  function updateBatchPreview() {
    const fmt = Barcodes.get(currentFormat);
    const values = getBatchValues();
    const showText = $('show-text').checked;
    const previewGrid = $('batch-preview-grid');
    const batchPlaceholder = $('batch-placeholder');
    const batchExport = $('batch-export');
    const batchCount = $('batch-count');

    if (!values.length) {
      previewGrid.innerHTML = '';
      batchPlaceholder.style.display = '';
      batchExport.style.display = 'none';
      if (batchCount) batchCount.textContent = '0 items';
      return;
    }

    batchPlaceholder.style.display = 'none';
    if (batchCount) batchCount.textContent = `${values.length} items`;

    const { valid, invalid } = Batch.validateAll(values, fmt);
    const userOpts = getFormatOptions();

    previewGrid.innerHTML = '';

    const results = Batch.generateAll(valid, fmt, userOpts, showText);

    const allItems = [
      ...results.map(r => ({ ...r, type: r.error ? 'error' : 'valid' })),
      ...invalid.map(inv => ({ ...inv, type: 'invalid' })),
    ].sort((a, b) => a.index - b.index);

    allItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'batch-card';

      if (item.type === 'invalid' || item.type === 'error') {
        card.classList.add('batch-card-error');
        card.innerHTML = `
          <div class="batch-card-preview batch-card-error-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span class="batch-error-msg">${item.error || 'Generation failed'}</span>
          </div>
          <div class="batch-card-label" title="${item.value}">${item.value}</div>
        `;
      } else {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'batch-card-preview';
        item.canvas.style.maxWidth = '100%';
        item.canvas.style.height = 'auto';
        item.canvas.style.imageRendering = 'pixelated';
        imgDiv.appendChild(item.canvas);

        const labelDiv = document.createElement('div');
        labelDiv.className = 'batch-card-label';
        labelDiv.title = item.value;
        labelDiv.textContent = item.value;

        card.appendChild(imgDiv);
        card.appendChild(labelDiv);
      }

      previewGrid.appendChild(card);
    });

    batchExport.style.display = valid.length ? '' : 'none';
  }

  let batchDebounce = null;
  function debouncedBatchPreview() {
    clearTimeout(batchDebounce);
    batchDebounce = setTimeout(updateBatchPreview, 400);
  }

  /* =========================================================================
     BATCH EXPORT
     ========================================================================= */

  async function exportBatchPDF() {
    const fmt = Barcodes.get(currentFormat);
    const values = getBatchValues().filter(v => !fmt.validate(v));
    if (!values.length) return;

    const btn = $('batch-pdf-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const pdfOpts = getPDFOptions();
      await PDFExport.download(values, fmt, getFormatOptions(), $('show-text').checked, pdfOpts);
    } catch (e) {
      alert('PDF export failed: ' + e.message);
    }

    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg> Download PDF`;
  }

  async function exportBatchZipPNG() {
    const fmt = Barcodes.get(currentFormat);
    const values = getBatchValues().filter(v => !fmt.validate(v));
    if (!values.length) return;

    const btn = $('batch-zip-png-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const blob = await Batch.exportZIP(values, fmt, getFormatOptions(), $('show-text').checked, 512);
      downloadBlob(blob, `barcodes-${fmt.id}-png.zip`);
    } catch (e) {
      alert('ZIP export failed: ' + e.message);
    }

    btn.disabled = false;
    btn.textContent = 'ZIP (PNG)';
  }

  async function exportBatchZipSVG() {
    const fmt = Barcodes.get(currentFormat);
    const values = getBatchValues().filter(v => !fmt.validate(v));
    if (!values.length) return;

    const btn = $('batch-zip-svg-btn');
    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const blob = await Batch.exportZipSVG(values, fmt, getFormatOptions(), $('show-text').checked);
      downloadBlob(blob, `barcodes-${fmt.id}-svg.zip`);
    } catch (e) {
      alert('ZIP export failed: ' + e.message);
    }

    btn.disabled = false;
    btn.textContent = 'ZIP (SVG)';
  }

  /* =========================================================================
     PDF OPTIONS
     ========================================================================= */

  function getPDFOptions() {
    return {
      preset: $('pdf-preset').value,
      pageSize: $('pdf-page-size').value,
      orientation: $('pdf-orientation').value,
      labelWidth: parseFloat($('pdf-custom-w')?.value) || 30,
      labelHeight: parseFloat($('pdf-custom-h')?.value) || 15,
      gap: 2,
      margin: 10,
    };
  }

  function updatePDFCustomFields() {
    const custom = $('pdf-custom-fields');
    if ($('pdf-preset').value === 'custom') {
      custom.style.display = '';
    } else {
      custom.style.display = 'none';
    }
  }

  /* =========================================================================
     FILE DROP / UPLOAD
     ========================================================================= */

  function setupFileDrop() {
    const dropZone = $('batch-drop');
    const fileInput = $('batch-file-input');
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) await loadFile(file);
    });

    fileInput.addEventListener('change', async () => {
      if (fileInput.files[0]) await loadFile(fileInput.files[0]);
      fileInput.value = '';
    });
  }

  async function loadFile(file) {
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
      alert('Please upload a .txt, .csv, or .tsv file');
      return;
    }

    try {
      const content = await Batch.readFile(file);
      $('batch-input').value = content;
      debouncedBatchPreview();
    } catch (e) {
      alert('Failed to read file: ' + e.message);
    }
  }

  /* =========================================================================
     MODE & TAB SWITCHING
     ========================================================================= */

  function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.gx-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    $('single-panel').style.display = mode === 'single' ? '' : 'none';
    $('batch-panel').style.display = mode === 'batch' ? '' : 'none';

    if (mode === 'single') {
      updateSinglePreview();
    } else {
      debouncedBatchPreview();
    }
  }

  /* =========================================================================
     EVENT HANDLERS
     ========================================================================= */

  function onInputChange() {
    if (currentMode === 'single') {
      updateSinglePreview();
    } else {
      debouncedBatchPreview();
    }
  }

  function onFormatChange() {
    currentFormat = $('format-select').value;
    const fmt = Barcodes.get(currentFormat);

    $('single-input').placeholder = Barcodes.getPlaceholder(currentFormat);
    $('show-text').checked = fmt.showTextDefault;

    buildFormatSpecificOptions();
    onInputChange();
  }

  /* =========================================================================
     INIT
     ========================================================================= */

  function init() {
    buildFormatOptions();
    buildFormatSpecificOptions();

    $('single-input').placeholder = Barcodes.getPlaceholder(currentFormat);
    $('show-text').checked = Barcodes.get(currentFormat).showTextDefault;

    $('format-select').addEventListener('change', onFormatChange);
    $('show-text').addEventListener('change', onInputChange);
    $('single-input').addEventListener('input', updateSinglePreview);

    $('export-svg').addEventListener('click', exportSingleSVG);
    $('export-single-pdf').addEventListener('click', exportSinglePDF);

    EXPORT_SIZES.forEach(size => {
      $(`export-png-${size}`)?.addEventListener('click', () => exportSingleRaster('png', size));
      $(`export-jpg-${size}`)?.addEventListener('click', () => exportSingleRaster('jpg', size));
    });

    document.querySelectorAll('.gx-tab').forEach(tab => {
      tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    $('batch-input').addEventListener('input', debouncedBatchPreview);
    $('batch-pdf-btn').addEventListener('click', exportBatchPDF);
    $('batch-zip-png-btn').addEventListener('click', exportBatchZipPNG);
    $('batch-zip-svg-btn').addEventListener('click', exportBatchZipSVG);

    $('pdf-preset').addEventListener('change', updatePDFCustomFields);
    updatePDFCustomFields();

    setupFileDrop();
    switchMode('single');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { switchMode };
})();
