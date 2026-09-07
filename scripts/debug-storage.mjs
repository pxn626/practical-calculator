import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// 看 storage 都有啥
const storage = await page.evaluate(() => {
  const result = { localStorage: {}, sessionStorage: {}, cookies: document.cookie }
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    result.localStorage[k] = localStorage.getItem(k)
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i)
    result.sessionStorage[k] = sessionStorage.getItem(k)
  }
  return result
})
console.log(JSON.stringify(storage, null, 2))
await browser.close()
