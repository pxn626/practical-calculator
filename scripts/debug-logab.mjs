import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// 切科学
await page.locator('.toolbar-btn').nth(1).click()
await page.waitForTimeout(500)

// 按 log (idx 3)
await page.locator('.key.sci').nth(3).click()
await page.waitForTimeout(500)
let disp = await page.locator('.calc-display').first().innerText().catch(() => '')
console.log(`After log: "${disp.replace(/\n/g, ' | ')}"`)

// AC
await page.locator('.key.func:has-text("AC")').first().click()
await page.waitForTimeout(300)

// 按 logₐ (idx 4)
await page.locator('.key.sci').nth(4).click()
await page.waitForTimeout(500)
disp = await page.locator('.calc-display').first().innerText().catch(() => '')
console.log(`After logₐ: "${disp.replace(/\n/g, ' | ')}"`)

await browser.close()
