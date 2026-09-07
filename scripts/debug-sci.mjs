import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// 切换科学模式
await page.locator('.toolbar-btn').nth(1).click()
await page.waitForTimeout(500)

const sciKeys = await page.evaluate(() => {
  const sci = Array.from(document.querySelectorAll('.key.sci'))
  return sci.map((k, i) => ({ i, text: k.innerText.trim(), classes: k.className }))
})
console.log(JSON.stringify(sciKeys, null, 2))
await browser.close()
