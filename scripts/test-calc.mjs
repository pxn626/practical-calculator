// test-calc.mjs - 测试计算器功能 (改进版)
import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:5183/'
const OUT = process.argv[3] || '/tmp/uni-test-calc.png'

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3
  })
  
  const page = await context.newPage()
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)
  
  // 用 .key 类(calc-keypad 渲染的 button 有 key 类) + 文本
  console.log(`[test-calc] 测试 1 + 1 = 2:`)
  
  async function clickKey(key) {
    // 多种选择器尝试
    const selectors = [
      `.key:has-text("${key}")`,
      `.key >> text="${key}"`,
      `text="${key}" >> nth=0`
    ]
    
    for (const sel of selectors) {
      try {
        const el = page.locator(sel).first()
        if (await el.count() > 0) {
          await el.click({ timeout: 2000 })
          return true
        }
      } catch (e) {
        // 继续下一个
      }
    }
    return false
  }
  
  for (const key of ['1', '+', '1', '=']) {
    const ok = await clickKey(key)
    console.log(`[test-calc] ${ok ? '✓' : '✗'} 点击 "${key}"`)
    await page.waitForTimeout(400)
  }
  
  await page.waitForTimeout(1000)
  await page.screenshot({ path: OUT, fullPage: true })
  console.log(`[test-calc] 截图保存到 ${OUT}`)
  
  // 读显示屏 — 用 .calc-display 类
  const displayText = await page.locator('.calc-display').first().innerText().catch(() => 'unknown')
  console.log(`[test-calc] 显示屏: ${displayText.replace(/\n/g, ' | ')}`)
  
  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})