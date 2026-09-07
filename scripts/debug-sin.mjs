// debug-sin.mjs - 单独 debug sin(30)
import { chromium } from 'playwright'

const URL = 'http://localhost:5183/'

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  })
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3
  })
  
  const page = await context.newPage()
  
  const consoleLogs = []
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
  const pageErrors = []
  page.on('pageerror', err => pageErrors.push(err.message))
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)
  
  console.log('=== 初始状态 ===')
  
  // 切到 scientific 模式
  const modeBtn = page.locator('.toolbar-btn').nth(1)
  await modeBtn.click()
  await page.waitForTimeout(500)
  
  // 看 .sci 键是否出现
  const sciKeys = await page.evaluate(() => {
    const keys = Array.from(document.querySelectorAll('.key.sci'))
    return keys.map(k => k.innerText.trim())
  })
  console.log(`科学键: ${JSON.stringify(sciKeys)}`)
  
  // 点击 sin 键
  const sinKey = page.locator('.key.sci:has-text("sin")').first()
  console.log(`sin 键找到: ${await sinKey.count() > 0}`)
  
  await sinKey.click()
  await page.waitForTimeout(300)
  
  // 输入 30 )
  for (const key of ['3', '0', ')']) {
    // 在 scientific 模式下,sci 键在上面,数字键在下面
    const k = page.locator(`.key:has-text("${key}")`).first()
    await k.click()
    await page.waitForTimeout(200)
  }
  
  // 点击 =
  const eq = page.locator('.key.equals').first()
  await eq.click()
  await page.waitForTimeout(500)
  
  // 看显示
  const display = await page.locator('.calc-display').first().innerText().catch(() => 'unknown')
  console.log(`显示屏: "${display.replace(/\n/g, ' | ')}"`)
  
  // 看表达式实际是什么
  const expr = await page.evaluate(() => {
    const exprEl = document.querySelector('.calc-display .expression') || document.querySelector('.calc-display [class*="expression"]')
    return exprEl?.innerText || 'no expression element'
  })
  console.log(`表达式元素: "${expr}"`)
  
  console.log('\n=== Console 日志 ===')
  consoleLogs.forEach(log => console.log(log))
  
  if (pageErrors.length > 0) {
    console.log('\n=== 页面错误 ===')
    pageErrors.forEach(e => console.log(e))
  }
  
  // 截图
  await page.screenshot({ path: '/tmp/debug-sin.png', fullPage: true })
  
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })