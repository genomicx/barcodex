import { test, expect } from '@playwright/test'

test.describe('BARCODEX e2e — barcode generation', () => {
  test('loads the app with format selector visible', async ({ page }) => {
    await page.goto('/')

    // The barcode generator page renders a format selector and text input
    await expect(page.getByRole('tab', { name: /single/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /batch/i })).toBeVisible()
  })

  test('typing a value renders a canvas barcode preview', async ({ page }) => {
    await page.goto('/')

    // Default format is qrcode. The input is aria-labelled "Barcode value"
    const input = page.getByRole('textbox', { name: /barcode value/i })
    await expect(input).toBeVisible()

    // Type a QR-compatible value
    await input.fill('SAMPLE001')

    // BarcodePreview injects a <canvas> into the preview-area div
    const canvas = page.locator('.preview-area canvas')
    await expect(canvas).toBeVisible({ timeout: 10_000 })
  })

  test('invalid input shows a preview-error instead of canvas', async ({ page }) => {
    await page.goto('/')

    // Switch to EAN-13 which requires exactly 12 digits
    // Select it via the FormatSelector — look for a select element
    const formatSelect = page.locator('select').first()
    await formatSelect.selectOption('ean13')

    const input = page.getByRole('textbox', { name: /barcode value/i })
    await input.fill('NOTANUMBER')

    // Should show an error div, not a canvas
    await expect(page.locator('.preview-error')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('.preview-area canvas')).not.toBeVisible()
  })
})
