/**
 * Barcode rendering via bwip-js.
 * Wraps bwip-js to produce canvas and SVG output.
 */

const Renderer = (() => {

  const IS_2D = new Set(['datamatrix', 'qrcode']);

  /**
   * Map cryptic bwip-js errors to human-friendly messages.
   */
  function friendlyError(e) {
    const msg = e.message || String(e);

    if (/GS1aiMissingOpenParen|AIs must start/i.test(msg))
      return 'GS1-128 values must use parenthesised application identifiers, e.g. (01)09501101530003(17)260101';
    if (/badLength|too long|too short/i.test(msg))
      return 'Input length is not valid for this barcode format';
    if (/badCharacter|not valid/i.test(msg))
      return 'Input contains characters not supported by this format';
    if (/checkDigit|checksum/i.test(msg))
      return 'Check digit is incorrect — verify the number and try again';
    if (/encode/i.test(msg))
      return 'Could not encode this input — check the format requirements';

    // Strip the bwipp prefix for anything else
    return msg.replace(/^bwipp\.\w+#\d+:\s*/i, '');
  }

  /**
   * Build bwip-js options from format definition and user selections.
   * For 2D codes, includetext is always false (we draw captions ourselves).
   */
  function buildOptions(formatDef, text, userOpts = {}, showText = null) {
    const want = showText !== null ? showText : formatDef.showTextDefault;
    const is2d = IS_2D.has(formatDef.id);

    const opts = {
      bcid: formatDef.bwipType,
      text: text,
      scale: 3,
      includetext: is2d ? false : want,
      textxalign: 'center',
    };

    for (const optDef of formatDef.options) {
      const val = userOpts[optDef.id] ?? optDef.default;
      if (!val) continue;
      switch (optDef.id) {
        case 'eclevel': opts.eclevel = val; break;
        case 'dmsize':
          if (val) {
            const parts = val.split('x');
            opts.columns = parseInt(parts[0]);
            opts.rows = parseInt(parts[1]);
          }
          break;
        case 'barheight': opts.height = parseInt(val); break;
      }
    }

    return opts;
  }

  /**
   * Add a text caption below a barcode canvas.
   * Returns a new canvas with the caption appended.
   */
  function addCaption(srcCanvas, text, scale) {
    const fontSize = Math.max(10, Math.round(scale * 3.5));
    const padding = Math.round(fontSize * 0.6);
    const captionH = fontSize + padding * 2;

    const out = document.createElement('canvas');
    out.width = srcCanvas.width;
    out.height = srcCanvas.height + captionH;
    const ctx = out.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    // Draw barcode
    ctx.drawImage(srcCanvas, 0, 0);

    // Draw caption
    ctx.fillStyle = '#0f172a';
    ctx.font = `500 ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Truncate if too wide
    let label = text;
    const maxW = out.width - padding * 2;
    while (ctx.measureText(label).width > maxW && label.length > 3) {
      label = label.slice(0, -4) + '...';
    }

    ctx.fillText(label, out.width / 2, srcCanvas.height + captionH / 2);
    return out;
  }

  /**
   * Should we draw a caption ourselves?
   */
  function needsCaption(formatDef, showText) {
    return IS_2D.has(formatDef.id) && showText;
  }

  /**
   * Render barcode to a canvas element.
   */
  function toCanvas(formatDef, text, userOpts = {}, showText = null, scale = 3) {
    const opts = buildOptions(formatDef, text, userOpts, showText);
    opts.scale = scale;

    const canvas = document.createElement('canvas');
    try {
      bwipjs.toCanvas(canvas, opts);
    } catch (e) {
      throw new Error(friendlyError(e));
    }

    const want = showText !== null ? showText : formatDef.showTextDefault;
    if (needsCaption(formatDef, want)) {
      return addCaption(canvas, text, scale);
    }

    return canvas;
  }

  /**
   * Render barcode to SVG string.
   */
  function toSVG(formatDef, text, userOpts = {}, showText = null) {
    if (typeof bwipjs.toSVG === 'function') {
      const opts = buildOptions(formatDef, text, userOpts, showText);
      delete opts.scale;
      let svg;
      try { svg = bwipjs.toSVG(opts); }
      catch (e) { throw new Error(friendlyError(e)); }

      const want = showText !== null ? showText : formatDef.showTextDefault;
      if (needsCaption(formatDef, want)) {
        // For SVG with caption, fall back to canvas-based approach
        const canvas = toCanvas(formatDef, text, userOpts, showText, 10);
        const dataUrl = canvas.toDataURL('image/png');
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" image-rendering="pixelated"/>
</svg>`;
      }
      return svg;
    }

    const canvas = toCanvas(formatDef, text, userOpts, showText, 10);
    const dataUrl = canvas.toDataURL('image/png');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" image-rendering="pixelated"/>
</svg>`;
  }

  /**
   * Render barcode to canvas at a specific pixel size for raster export.
   */
  function toSizedCanvas(formatDef, text, targetSize, userOpts = {}, showText = null) {
    const hiRes = toCanvas(formatDef, text, userOpts, showText, 10);

    const aspect = hiRes.width / hiRes.height;
    let outW, outH;
    if (aspect >= 1) {
      outW = targetSize;
      outH = Math.round(targetSize / aspect);
    } else {
      outH = targetSize;
      outW = Math.round(targetSize * aspect);
    }

    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const ctx = out.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(hiRes, 0, 0, outW, outH);

    return out;
  }

  /**
   * Render for preview display.
   */
  function toPreview(formatDef, text, userOpts = {}, showText = null) {
    return toCanvas(formatDef, text, userOpts, showText, 4);
  }

  return { toCanvas, toSVG, toSizedCanvas, toPreview, buildOptions };
})();
