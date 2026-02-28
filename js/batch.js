/**
 * Batch barcode generation from text files or pasted lists.
 */

const Batch = (() => {

  /**
   * Parse input text into an array of values.
   * Splits by newline, trims whitespace, removes empty lines.
   */
  function parseInput(text) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Read a text file and return its contents.
   */
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Validate all values against a format and return results.
   */
  function validateAll(values, formatDef) {
    const valid = [];
    const invalid = [];

    values.forEach((value, index) => {
      const error = formatDef.validate(value);
      if (error) {
        invalid.push({ index, value, error });
      } else {
        valid.push({ index, value });
      }
    });

    return { valid, invalid };
  }

  /**
   * Generate barcode canvases for all valid values.
   */
  function generateAll(items, formatDef, userOpts, showText) {
    const results = [];

    for (const item of items) {
      try {
        const canvas = Renderer.toPreview(formatDef, item.value, userOpts, showText);
        results.push({ index: item.index, value: item.value, canvas });
      } catch (e) {
        results.push({ index: item.index, value: item.value, canvas: null, error: e.message });
      }
    }

    return results;
  }

  /**
   * Export all barcodes as individual PNG files in a ZIP.
   */
  async function exportZIP(values, formatDef, userOpts, showText, size) {
    const zip = new JSZip();

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const error = formatDef.validate(value);
      if (error) continue;

      try {
        const canvas = Renderer.toSizedCanvas(formatDef, value, size, userOpts, showText);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const safeName = value.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50);
        zip.file(`${String(i + 1).padStart(4, '0')}_${safeName}.png`, blob);
      } catch (e) {
        // Skip failed barcodes
      }
    }

    return zip.generateAsync({ type: 'blob' });
  }

  /**
   * Export all barcodes as individual SVG files in a ZIP.
   */
  async function exportZipSVG(values, formatDef, userOpts, showText) {
    const zip = new JSZip();

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const error = formatDef.validate(value);
      if (error) continue;

      try {
        const svg = Renderer.toSVG(formatDef, value, userOpts, showText);
        const safeName = value.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 50);
        zip.file(`${String(i + 1).padStart(4, '0')}_${safeName}.svg`, svg);
      } catch (e) {
        // Skip failed
      }
    }

    return zip.generateAsync({ type: 'blob' });
  }

  return { parseInput, readFile, validateAll, generateAll, exportZIP, exportZipSVG };
})();
