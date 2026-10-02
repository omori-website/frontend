import assert from 'node:assert/strict'

// Run after entering the character section, when the footer is mounted.
export default async function checkFooter(page) {
  for (const width of [320, 362, 390, 640, 724, 768, 769, 1000, 1440]) {
    await page.setViewport({ width, height: 784 })
    await page.evaluate(() => document.fonts.ready)
    const layout = await page.evaluate(async () => {
      const footer = document.querySelector('#footer')
      const bounds = footer.getBoundingClientRect()
      const elements = [...footer.querySelectorAll('a, p, img')]
      const contained = elements.every(element => {
        const box = element.getBoundingClientRect()
        return box.left >= bounds.left && box.right <= bounds.right + 0.5 && box.bottom <= bounds.bottom + 0.5
      })
      const image = new Image()
      image.src = getComputedStyle(footer).backgroundImage.slice(5, -2)
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      const logo = footer.querySelector('.footer-logo').getBoundingClientRect()
      const paperBehindLogo = [logo.left, (logo.left + logo.right) / 2, logo.right - 1].every(x => {
        const pixelX = Math.floor((x - bounds.left) / bounds.width * image.width)
        const pixelY = Math.floor((logo.top - bounds.top) / bounds.height * image.height)
        return context.getImageData(pixelX, pixelY, 1, 1).data[3] >= 250
      })
      return { contained, paperBehindLogo, height: bounds.height, scrollWidth: footer.scrollWidth }
    })
    assert.ok(layout.contained, `Footer content stays within its bounds at ${width}px`)
    assert.equal(layout.scrollWidth, width, `Footer does not overflow horizontally at ${width}px`)
    assert.ok(layout.paperBehindLogo, `Branding sits on opaque paper at ${width}px`)
    if (width <= 768) assert.ok(layout.height <= 784, `Mobile footer fits a 784px viewport at ${width}px`)
  }
}
