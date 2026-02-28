/**
 * QRx — Main application logic.
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
    if (!fmt.options.length) {
      container.className = '';
      return;
    }

    container.className = 'field-sm';

    fmt.options.forEach(optDef => {
      if (optDef.type === 'select') {
        const wrapper = document.createElement('div');

        const label = document.createElement('label');
        label.textContent = optDef.label;
        label.htmlFor = `opt-${optDef.id}`;
        wrapper.appendChild(label);

        const sel = document.createElement('select');
        sel.className = 'gx-select';
        sel.id = `opt-${optDef.id}`;
        optDef.choices.forEach(ch => {
          const o = document.createElement('option');
          o.value = ch.value;
          o.textContent = ch.label;
          if (ch.value === optDef.default) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener('change', onInputChange);
        wrapper.appendChild(sel);
        container.appendChild(wrapper);
      }
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

  function showExport(el, visible) {
    el.classList.toggle('visible', visible);
  }

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
      showExport(exportPanel, false);
      return;
    }

    const error = fmt.validate(text);
    if (error) {
      preview.innerHTML = `<div class="qr-error">${error}</div>`;
      placeholder.style.display = 'none';
      showExport(exportPanel, false);
      return;
    }

    try {
      const canvas = Renderer.toPreview(fmt, text, getFormatOptions(), showText);
      preview.innerHTML = '';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.style.imageRendering = 'pixelated';
      preview.appendChild(canvas);
      placeholder.style.display = 'none';
      showExport(exportPanel, true);
    } catch (e) {
      preview.innerHTML = `<div class="qr-error">${e.message}</div>`;
      placeholder.style.display = 'none';
      showExport(exportPanel, false);
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
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `barcode-${fmt.id}.svg`);
    } catch (e) { alert('Export failed: ' + e.message); }
  }

  function exportSingleRaster(format, size) {
    const fmt = Barcodes.get(currentFormat);
    const text = $('single-input').value.trim();
    if (!text || fmt.validate(text)) return;
    try {
      const canvas = Renderer.toSizedCanvas(fmt, text, size, getFormatOptions(), $('show-text').checked);
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(blob => downloadBlob(blob, `barcode-${fmt.id}-${size}.${format}`), mime, format === 'jpg' ? 0.95 : undefined);
    } catch (e) { alert('Export failed: ' + e.message); }
  }

  function exportSinglePDF() {
    const fmt = Barcodes.get(currentFormat);
    const text = $('single-input').value.trim();
    if (!text || fmt.validate(text)) return;
    PDFExport.download([text], fmt, getFormatOptions(), $('show-text').checked, getPDFOptions());
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
    const grid = $('batch-preview-grid');
    const placeholder = $('batch-placeholder');
    const batchExport = $('batch-export');
    const batchCount = $('batch-count');

    if (!values.length) {
      grid.innerHTML = '';
      placeholder.style.display = '';
      showExport(batchExport, false);
      if (batchCount) batchCount.textContent = '0 items';
      return;
    }

    placeholder.style.display = 'none';
    if (batchCount) batchCount.textContent = `${values.length} items`;

    const { valid, invalid } = Batch.validateAll(values, fmt);
    const results = Batch.generateAll(valid, fmt, getFormatOptions(), showText);

    grid.innerHTML = '';

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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span class="batch-error-msg">${item.error || 'Failed'}</span>
          </div>
          <div class="batch-card-label" title="${item.value}">${item.value}</div>`;
      } else {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'batch-card-preview';
        item.canvas.style.maxWidth = '100%';
        item.canvas.style.height = 'auto';
        item.canvas.style.imageRendering = 'pixelated';
        imgDiv.appendChild(item.canvas);

        const label = document.createElement('div');
        label.className = 'batch-card-label';
        label.title = item.value;
        label.textContent = item.value;

        card.appendChild(imgDiv);
        card.appendChild(label);
      }
      grid.appendChild(card);
    });

    showExport(batchExport, valid.length > 0);
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
    btn.disabled = true; btn.textContent = 'Generating...';
    try { await PDFExport.download(values, fmt, getFormatOptions(), $('show-text').checked, getPDFOptions()); }
    catch (e) { alert('PDF export failed: ' + e.message); }
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg> Download PDF';
  }

  async function exportBatchZipPNG() {
    const fmt = Barcodes.get(currentFormat);
    const values = getBatchValues().filter(v => !fmt.validate(v));
    if (!values.length) return;
    const btn = $('batch-zip-png-btn');
    btn.disabled = true; btn.textContent = 'Generating...';
    try { downloadBlob(await Batch.exportZIP(values, fmt, getFormatOptions(), $('show-text').checked, 512), `barcodes-${fmt.id}-png.zip`); }
    catch (e) { alert('ZIP export failed: ' + e.message); }
    btn.disabled = false; btn.textContent = 'ZIP (PNG)';
  }

  async function exportBatchZipSVG() {
    const fmt = Barcodes.get(currentFormat);
    const values = getBatchValues().filter(v => !fmt.validate(v));
    if (!values.length) return;
    const btn = $('batch-zip-svg-btn');
    btn.disabled = true; btn.textContent = 'Generating...';
    try { downloadBlob(await Batch.exportZipSVG(values, fmt, getFormatOptions(), $('show-text').checked), `barcodes-${fmt.id}-svg.zip`); }
    catch (e) { alert('ZIP export failed: ' + e.message); }
    btn.disabled = false; btn.textContent = 'ZIP (SVG)';
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
      gap: 2, margin: 10,
    };
  }

  function updatePDFCustomFields() {
    const custom = $('pdf-custom-fields');
    custom.style.display = $('pdf-preset').value === 'custom' ? '' : 'none';
  }

  function setupPDFToggle() {
    const btn = $('pdf-toggle-btn');
    const body = $('pdf-body');
    btn.addEventListener('click', () => {
      btn.classList.toggle('open');
      body.classList.toggle('open');
    });
  }

  /* =========================================================================
     FILE DROP
     ========================================================================= */

  function setupFileDrop() {
    const drop = $('batch-drop');
    const input = $('batch-file-input');
    if (!drop || !input) return;

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', async e => {
      e.preventDefault(); drop.classList.remove('dragover');
      if (e.dataTransfer.files[0]) await loadFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', async () => {
      if (input.files[0]) await loadFile(input.files[0]);
      input.value = '';
    });
  }

  async function loadFile(file) {
    if (!/\.(txt|csv|tsv)$/.test(file.name)) { alert('Please upload a .txt, .csv, or .tsv file'); return; }
    try {
      $('batch-input').value = await Batch.readFile(file);
      debouncedBatchPreview();
    } catch (e) { alert('Failed to read file: ' + e.message); }
  }

  /* =========================================================================
     MODE SWITCHING
     ========================================================================= */

  function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    $('single-panel').style.display = mode === 'single' ? '' : 'none';
    $('batch-panel').style.display = mode === 'batch' ? '' : 'none';
    if (mode === 'single') updateSinglePreview();
    else debouncedBatchPreview();
  }

  /* =========================================================================
     EVENT HANDLERS
     ========================================================================= */

  function onInputChange() {
    if (currentMode === 'single') updateSinglePreview();
    else debouncedBatchPreview();
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
    EXPORT_SIZES.forEach(s => {
      $(`export-png-${s}`)?.addEventListener('click', () => exportSingleRaster('png', s));
      $(`export-jpg-${s}`)?.addEventListener('click', () => exportSingleRaster('jpg', s));
    });

    document.querySelectorAll('.mode-tab').forEach(t => t.addEventListener('click', () => switchMode(t.dataset.mode)));

    $('batch-input').addEventListener('input', debouncedBatchPreview);
    $('batch-pdf-btn').addEventListener('click', exportBatchPDF);
    $('batch-zip-png-btn').addEventListener('click', exportBatchZipPNG);
    $('batch-zip-svg-btn').addEventListener('click', exportBatchZipSVG);

    $('pdf-preset').addEventListener('change', updatePDFCustomFields);
    updatePDFCustomFields();
    setupPDFToggle();
    setupFileDrop();
    switchMode('single');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { switchMode };
})();
