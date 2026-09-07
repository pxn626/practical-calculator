import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewportSize({ width: 844, height: 390 })
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)
await page.screenshot({ path: '/tmp/uni-test-deep/landscape-final.png', fullPage: true })
console.log('landscape screenshot saved')
await browser.close()
