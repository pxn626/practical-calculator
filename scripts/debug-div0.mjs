import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// 按 AC
await page.locator('.key.func:has-text("AC")').first().click()
await page.waitForTimeout(500)

// 按 1
await page.locator('.key.num:has-text("1")').first().click()
await page.waitForTimeout(300)
let disp = await page.locator('.calc-display').first().innerText().catch(() => '')
console.log(`After 1: "${disp.replace(/\n/g, ' | ')}"`)

// 按 ÷
await page.locator('.key.op:has-text("÷")').first().click()
await page.waitForTimeout(300)
disp = await page.locator('.calc-display').first().innerText().catch(() => '')
console.log(`After ÷: "${disp.replace(/\n/g, ' | ')}"`)

// 按 0
await page.locator('.key.num:has-text("0")').first().click()
await page.waitForTimeout(300)
disp = await page.locator('.calc-display').first().innerText().catch(() => '')
console.log(`After 0: "${disp.replace(/\n/g, ' | ')}"`)

// 按 =
await page.locator('.key.equals').first().click()
await page.waitForTimeout(500)
disp = await page.locator('.calc-display').first().innerText().catch(() => '')
console.log(`After =: "${disp.replace(/\n/g, ' | ')}"`)

await browser.close()
