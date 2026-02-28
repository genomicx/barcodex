/**
 * Barcode rendering via bwip-js.
 * Wraps bwip-js to produce canvas and SVG output.
 */

const Renderer = (() => {

  /**
   * Build bwip-js options from format definition and user selections.
   */
  function buildOptions(formatDef, text, userOpts = {}, showText = null) {
    const opts = {
      bcid: formatDef.bwipType,
      text: text,
      scale: 3,
      includetext: showText !== null ? showText : formatDef.showTextDefault,
      textxalign: 'center',
    };

    for (const optDef of formatDef.options) {
      const val = userOpts[optDef.id] ?? optDef.default;
      if (!val) continue;

      switch (optDef.id) {
        case 'eclevel':
          opts.eclevel = val;
          break;
        case 'dmsize':
          if (val) {
            const parts = val.split('x');
            opts.columns = parseInt(parts[0]);
            opts.rows = parseInt(parts[1]);
          }
          break;
        case 'barheight':
          opts.height = parseInt(val);
          break;
      }
    }

    return opts;
  }

  /**
   * Render barcode to a canvas element.
   * @returns {HTMLCanvasElement}
   */
  function toCanvas(formatDef, text, userOpts = {}, showText = null, scale = 3) {
    const opts = buildOptions(formatDef, text, userOpts, showText);
    opts.scale = scale;

    const canvas = document.createElement('canvas');
    bwipjs.toCanvas(canvas, opts);
    return canvas;
  }

  /**
   * Render barcode to SVG string.
   * Uses bwipjs.toSVG if available, otherwise falls back to canvas data URL.
   * @returns {string}
   */
  function toSVG(formatDef, text, userOpts = {}, showText = null) {
    // Try native SVG output first
    if (typeof bwipjs.toSVG === 'function') {
      const opts = buildOptions(formatDef, text, userOpts, showText);
      delete opts.scale;
      return bwipjs.toSVG(opts);
    }

    // Fallback: render to canvas and wrap in SVG with embedded image
    const canvas = toCanvas(formatDef, text, userOpts, showText, 10);
    const dataUrl = canvas.toDataURL('image/png');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" image-rendering="pixelated"/>
</svg>`;
  }

  /**
   * Render barcode to canvas at a specific pixel size for raster export.
   * @returns {HTMLCanvasElement}
   */
  function toSizedCanvas(formatDef, text, targetSize, userOpts = {}, showText = null) {
    // Render at high scale
    const hiRes = toCanvas(formatDef, text, userOpts, showText, 10);

    // Fit to target size maintaining aspect ratio
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
   * @returns {HTMLCanvasElement}
   */
  function toPreview(formatDef, text, userOpts = {}, showText = null) {
    return toCanvas(formatDef, text, userOpts, showText, 4);
  }

  return { toCanvas, toSVG, toSizedCanvas, toPreview, buildOptions };
})();
