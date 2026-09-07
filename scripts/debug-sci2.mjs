import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.locator('.toolbar-btn').nth(1).click()
await page.waitForTimeout(500)

// 看所有 sci 键 + 全部 key 的文本
const all = await page.evaluate(() => {
  const sci = Array.from(document.querySelectorAll('.key.sci'))
  const num = Array.from(document.querySelectorAll('.key.num'))
  return {
    sci: sci.map((k, i) => ({ i, text: k.innerText.trim() })),
    num: num.map((k, i) => ({ i, text: k.innerText.trim() }))
  }
})
console.log(JSON.stringify(all, null, 2))
await browser.close()
