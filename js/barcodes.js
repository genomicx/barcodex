/**
 * Barcode format definitions, validation, and option schemas.
 */

const Barcodes = (() => {

  const FORMATS = {
    // --- 2D Matrix ---
    datamatrix: {
      id: 'datamatrix',
      bwipType: 'datamatrix',
      name: 'Data Matrix',
      group: '2D Matrix',
      description: 'Sample tracking standard for cryovials, tubes, plates',
      showTextDefault: false,
      options: [
        {
          id: 'dmsize',
          label: 'Size',
          type: 'select',
          default: '',
          choices: [
            { value: '', label: 'Auto' },
            { value: '10x10', label: '10x10' },
            { value: '12x12', label: '12x12' },
            { value: '14x14', label: '14x14' },
            { value: '16x16', label: '16x16' },
            { value: '18x18', label: '18x18' },
            { value: '20x20', label: '20x20' },
            { value: '22x22', label: '22x22' },
            { value: '24x24', label: '24x24' },
            { value: '26x26', label: '26x26' },
            { value: '8x18', label: '8x18 (rect)' },
            { value: '8x32', label: '8x32 (rect)' },
            { value: '12x26', label: '12x26 (rect)' },
            { value: '12x36', label: '12x36 (rect)' },
            { value: '16x36', label: '16x36 (rect)' },
            { value: '16x48', label: '16x48 (rect)' },
          ],
        },
      ],
      validate: (text) => {
        if (!text) return 'Enter text to encode';
        if (text.length > 2335) return 'Data Matrix supports up to 2,335 characters';
        return null;
      },
    },

    qrcode: {
      id: 'qrcode',
      bwipType: 'qrcode',
      name: 'QR Code',
      group: '2D Matrix',
      description: 'General purpose, scannable by phones',
      showTextDefault: false,
      options: [
        {
          id: 'eclevel',
          label: 'Error Correction',
          type: 'select',
          default: 'M',
          choices: [
            { value: 'L', label: 'Low (L) — 7% recovery' },
            { value: 'M', label: 'Medium (M) — 15% recovery' },
            { value: 'Q', label: 'Quartile (Q) — 25% recovery' },
            { value: 'H', label: 'High (H) — 30% recovery' },
          ],
        },
      ],
      validate: (text) => {
        if (!text) return 'Enter text to encode';
        if (text.length > 4296) return 'QR Code supports up to 4,296 characters';
        return null;
      },
    },

    // --- 1D Linear ---
    code128: {
      id: 'code128',
      bwipType: 'code128',
      name: 'Code 128',
      group: '1D Linear',
      description: 'LIMS sample IDs, equipment asset tags — most versatile 1D',
      showTextDefault: true,
      options: [
        {
          id: 'barheight',
          label: 'Bar Height (mm)',
          type: 'select',
          default: '10',
          choices: [
            { value: '5', label: '5mm' },
            { value: '8', label: '8mm' },
            { value: '10', label: '10mm' },
            { value: '15', label: '15mm' },
            { value: '20', label: '20mm' },
          ],
        },
      ],
      validate: (text) => {
        if (!text) return 'Enter text to encode';
        if (text.length > 80) return 'Keep Code 128 under 80 characters for reliable scanning';
        return null;
      },
    },

    code39: {
      id: 'code39',
      bwipType: 'code39',
      name: 'Code 39',
      group: '1D Linear',
      description: 'Legacy LIMS and healthcare sample tracking',
      showTextDefault: true,
      options: [
        {
          id: 'barheight',
          label: 'Bar Height (mm)',
          type: 'select',
          default: '10',
          choices: [
            { value: '5', label: '5mm' },
            { value: '8', label: '8mm' },
            { value: '10', label: '10mm' },
            { value: '15', label: '15mm' },
            { value: '20', label: '20mm' },
          ],
        },
      ],
      validate: (text) => {
        if (!text) return 'Enter text to encode';
        const valid = /^[A-Z0-9\-. $/+%]+$/;
        if (!valid.test(text.toUpperCase())) return 'Code 39 supports: A-Z, 0-9, - . $ / + % and space';
        if (text.length > 40) return 'Keep Code 39 under 40 characters for reliable scanning';
        return null;
      },
    },

    ean13: {
      id: 'ean13',
      bwipType: 'ean13',
      name: 'EAN-13',
      group: '1D Linear',
      description: 'Reagent, kit, and product identification',
      showTextDefault: true,
      options: [],
      validate: (text) => {
        if (!text) return 'Enter 12 or 13 digits';
        const digits = text.replace(/\s/g, '');
        if (!/^\d{12,13}$/.test(digits)) return 'EAN-13 requires exactly 12 or 13 digits';
        return null;
      },
    },

    gs1_128: {
      id: 'gs1_128',
      bwipType: 'gs1-128',
      name: 'GS1-128',
      group: '1D Linear',
      description: 'Supply chain — lot, expiry, GTIN for reagent tracking',
      showTextDefault: true,
      options: [
        {
          id: 'barheight',
          label: 'Bar Height (mm)',
          type: 'select',
          default: '15',
          choices: [
            { value: '8', label: '8mm' },
            { value: '10', label: '10mm' },
            { value: '15', label: '15mm' },
            { value: '20', label: '20mm' },
            { value: '25', label: '25mm' },
          ],
        },
      ],
      validate: (text) => {
        if (!text) return 'Enter GS1-128 data (e.g. (01)09501101530003(17)250101)';
        if (text.length > 48) return 'GS1-128 should be under 48 characters';
        return null;
      },
    },
  };

  const GROUPS = [
    { id: '2d', label: '2D Matrix', formats: ['datamatrix', 'qrcode'] },
    { id: '1d', label: '1D Linear', formats: ['code128', 'code39', 'ean13', 'gs1_128'] },
  ];

  function get(id) {
    return FORMATS[id] || null;
  }

  function all() {
    return FORMATS;
  }

  function groups() {
    return GROUPS;
  }

  function getPlaceholder(id) {
    const placeholders = {
      datamatrix: 'SAMPLE-2025-001',
      qrcode: 'https://example.com',
      code128: 'LAB-SAMPLE-001',
      code39: 'SAMPLE 001',
      ean13: '590123456789',
      gs1_128: '(01)09501101530003(17)250101',
    };
    return placeholders[id] || 'Enter text to encode';
  }

  return { get, all, groups, getPlaceholder, FORMATS, GROUPS };
})();
