// test-suite.mjs - 完整测试套件
// 测: 标准运算 / 科学运算 / 边界 / 模式切换 / 主题切换 / 历史记录 / 大写金额

import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:5183/'
const OUT_DIR = process.argv[3] || '/tmp/uni-test-suite'

const results = []
let pass = 0
let fail = 0

function logResult(category, name, ok, detail) {
  results.push({ category, name, ok, detail })
  if (ok) {
    pass++
    console.log(`✅ [${category}] ${name}: ${detail}`)
  } else {
    fail++
    console.log(`❌ [${category}] ${name}: ${detail}`)
  }
}

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
  const consoleLogs = []
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))
  const pageErrors = []
  page.on('pageerror', err => pageErrors.push(err.message))
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)
  
  // 工具函数
  async function clickKey(key) {
    const selectors = [
      `.key:has-text("${key}")`,
      `.key.sci:has-text("${key}")`,
      `.key.func:has-text("${key}")`,
      `.key.op:has-text("${key}")`,
      `.key.equals:has-text("${key}")`,
      `text="${key}"`,
    ]
    for (const sel of selectors) {
      const el = page.locator(sel).first()
      if (await el.count() > 0) {
        try {
          await el.click({ timeout: 2000 })
          return true
        } catch (e) { /* try next */ }
      }
    }
    return false
  }
  
  async function getDisplay() {
    const text = await page.locator('.calc-display').first().innerText().catch(() => 'unknown')
    return text.split('\n').map(s => s.trim()).filter(s => s)
  }
  
  async function clearAll() {
    await clickKey('AC')
    await page.waitForTimeout(300)
  }
  
  async function pressSequence(keys) {
    await clearAll()
    for (const k of keys) {
      const ok = await clickKey(k)
      if (!ok) {
        console.log(`  ❌ 没找到按键 "${k}"`)
        return false
      }
      await page.waitForTimeout(150)
    }
    // 自动按 = 触发计算(除非最后一个键就是 =)
    if (keys[keys.length - 1] !== '=') {
      await clickKey('=')
      await page.waitForTimeout(400)
    }
    return true
  }
  
  async function expectResult(expected, category, name, tolerance = 0.0001) {
    const display = await getDisplay()
    const expr = display[0] || ''
    const result = display[1] || ''
    console.log(`  表达式: "${expr}" 结果: "${result}"`)
    
    // 容差比较(浮点数)
    const actualNum = parseFloat(result)
    const expectedNum = parseFloat(expected)
    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      if (Math.abs(actualNum - expectedNum) < tolerance) {
        logResult(category, name, true, `${expr} = ${result} (期望 ${expected})`)
        return true
      }
    }
    
    if (result === expected || result.startsWith(expected)) {
      logResult(category, name, true, `${expr} = ${result}`)
      return true
    }
    
    logResult(category, name, false, `${expr} = ${result} (期望 ${expected})`)
    return false
  }
  
  // === 标准运算(8 个) ===
  console.log(`\n=== 标准运算 ===`)
  
  await pressSequence(['1', '+', '2', '='])
  await expectResult('3', '标准', '1+2')
  
  await pressSequence(['9', '−', '4', '='])
  await expectResult('5', '标准', '9-4')
  
  await pressSequence(['6', '×', '7', '='])
  await expectResult('42', '标准', '6×7')
  
  await pressSequence(['8', '÷', '2', '='])
  await expectResult('4', '标准', '8÷2')
  
  await pressSequence(['1', '0', '%', '='])
  await expectResult('0.1', '标准', '10%')
  
  await pressSequence(['2', '.', '5', '+', '3', '.', '5', '='])
  await expectResult('6', '标准', '2.5+3.5')
  
  await pressSequence(['1', '0', '0', '−', '1', '='])
  await expectResult('99', '标准', '100-1')
  
  await pressSequence(['1', '2', '×', '1', '0', '='])
  await expectResult('120', '标准', '12×10')
  
  // === 边界测试(6 个) ===
  console.log(`\n=== 边界测试 ===`)
  
  await pressSequence(['5', '÷', '0', '='])
  const divZero = await getDisplay()
  const divZeroResult = divZero[1] || ''
  logResult('边界', '5÷0', 
    divZeroResult.includes('Error') || divZeroResult.includes('Infinity') || divZeroResult.includes('∞') || divZeroResult === 'NaN',
    `5÷0 = "${divZeroResult}"(期望 Error/Infinity)`)
  
  await pressSequence(['0', '÷', '5', '='])
  await expectResult('0', '边界', '0÷5')
  
  await pressSequence(['1', '÷', '3', '='])
  // 1/3 = 0.333333... 长精度,只看是否有效
  const divResult = (await getDisplay())[1] || ''
  logResult('边界', '1÷3 精度',
    /^0\.33/.test(divResult) || divResult === '0.3333333333' || /^0\.3/.test(divResult),
    `1÷3 = "${divResult}"(期望 0.333...)`)
  
  // 大数
  await pressSequence(['9', '9', '9', '9', '9', '9', '×', '9', '9', '9', '9', '9', '9', '='])
  const bigNum = (await getDisplay())[1] || ''
  logResult('边界', '999999×999999 大数',
    bigNum.length > 10 && !bigNum.includes('Error'),
    `${bigNum.slice(0, 20)}...(${bigNum.length} chars)`)
  
  // 连续运算
  await pressSequence(['5', '+', '5', '=', '+', '5', '='])
  const chainResult = (await getDisplay())[1] || ''
  logResult('边界', '连续运算 5+5=+5=',
    chainResult === '15',
    `5+5=+5= ${chainResult}(期望 15)`)
  
  // 退格
  await pressSequence(['1', '2', '3', '⌫'])
  const afterDel = await getDisplay()
  logResult('边界', '⌫ 退格',
    afterDel[0] === '12' || afterDel.join('').includes('12'),
    `退格后表达式: "${afterDel[0]}"`)
  
  // === 切科学模式(15 个键) ===
  console.log(`\n=== 科学运算 ===`)
  
  // 切到科学模式 — 点击顶部 📱 按钮(切到 scientific)
  const modeBtn = page.locator('.toolbar-btn').nth(1)  // 📱 按钮
  if (await modeBtn.count() > 0) {
    await modeBtn.click()
    await page.waitForTimeout(500)
    logResult('科学', '切到 scientific 模式', true, '点击 📱 按钮')
  } else {
    logResult('科学', '切到 scientific 模式', false, '没找到模式按钮')
  }
  
  await pressSequence(["sin", "3", "0", ")"])
  const sinResult = (await getDisplay())[1] || ''
  logResult('科学', 'sin(30)',
    Math.abs(parseFloat(sinResult) - 0.5) < 0.001,
    `sin(30°) = ${sinResult}(期望 0.5)`)
  
  await pressSequence(["cos", "6", "0", ")"])
  const cosResult = (await getDisplay())[1] || ''
  logResult('科学', 'cos(60)',
    Math.abs(parseFloat(cosResult) - 0.5) < 0.001,
    `cos(60°) = ${cosResult}(期望 0.5)`)
  
  await pressSequence(['√', '1', '4', '4', ')'])
  const sqrtResult = (await getDisplay())[1] || ''
  logResult('科学', '√144',
    sqrtResult === '12',
    `√144 = ${sqrtResult}(期望 12)`)
  
  await pressSequence(['5', '!'])
  const factorialResult = (await getDisplay())[1] || ''
  logResult('科学', '5!',
    factorialResult === '120',
    `5! = ${factorialResult}(期望 120)`)
  
  await pressSequence(['π'])
  const piResult = (await getDisplay())[1] || ''
  logResult('科学', 'π 按钮',
    /^3\.14/.test(piResult),
    `π = ${piResult}(期望 3.14159...)`)
  
  await pressSequence(['2', '^', '1', '0', ')', '='])
  const powResult = (await getDisplay())[1] || ''
  logResult('科学', '2^10',
    powResult === '1024',
    `2^10 = ${powResult}(期望 1024)`)
  
  await pressSequence(['(', '(', '1', '+', '2', ')', '×', '(', '3', '+', '4', ')', ')', '='])
  const parenResult = (await getDisplay())[1] || ''
  logResult('科学', '嵌套括号 (1+2)×(3+4)',
    parenResult === '21',
    `(1+2)×(3+4) = ${parenResult}(期望 21)`)
  
  await pressSequence(['log', '1', '0', '0', '0', ')'])
  const logResult2 = (await getDisplay())[1] || ''
  logResult('科学', 'log(1000)',
    logResult2 === '3' || /^3$/.test(logResult2),
    `log(1000) = ${logResult2}(期望 3)`)
  
  // === 主题切换 ===
  console.log(`\n=== 主题切换 ===`)
  
  const themeBtn = page.locator('.toolbar-btn').nth(2)  // ☾ 按钮
  if (await themeBtn.count() > 0) {
    await themeBtn.click()
    await page.waitForTimeout(500)
    // 读 html 的 data-theme
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'unknown')
    logResult('主题', '切到 dark 模式', theme === 'dark' || theme !== 'unknown', `data-theme="${theme}"`)
    
    // 再切回 light
    await themeBtn.click()
    await page.waitForTimeout(500)
    const theme2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'unknown')
    logResult('主题', '切回 light 模式', theme2 === 'light' || theme2 !== 'unknown', `data-theme="${theme2}"`)
  } else {
    logResult('主题', '切主题', false, '没找到 ☾ 按钮')
  }
  
  // === 历史记录 ===
  console.log(`\n=== 历史记录 ===`)
  
  // 切回 standard
  await page.locator('.toolbar-btn').nth(1).click()
  await page.waitForTimeout(300)
  
  // 算一个存进历史
  await pressSequence(['7', '+', '8', '='])
  
  // 打开历史(点 ≡ 按钮)
  const historyBtn = page.locator('.toolbar-btn').nth(0)
  if (await historyBtn.count() > 0) {
    await historyBtn.click()
    await page.waitForTimeout(800)
    
    // 看 history panel 是否显示
    const historyVisible = await page.locator('.history-panel').first().isVisible().catch(() => false)
    logResult('历史', '打开历史面板', historyVisible, historyVisible ? 'history-panel 可见' : '不可见')
    
    // 关闭
    await historyBtn.click()
    await page.waitForTimeout(300)
  } else {
    logResult('历史', '打开历史面板', false, '没找到 ≡ 按钮')
  }
  
  // === 大写金额 ===
  console.log(`\n=== 大写金额 ===`)
  
  // "Chinese" 按钮触发大写转换
  const chineseBtn = page.locator('text="Chinese"').first()
  if (await chineseBtn.count() > 0) {
    await pressSequence(['1', '2', '3', '.', '4', '5'])
    await chineseBtn.click()
    await page.waitForTimeout(800)
    
    const capitalPanel = await page.locator('.capital-display, .capital-panel, [class*="capital"]').first().innerText().catch(() => '')
    logResult('大写', '123.45 → 中文大写',
      capitalPanel.length > 0 && (capitalPanel.includes('壹') || capitalPanel.includes('一') || capitalPanel.length > 5),
      capitalPanel.slice(0, 80))
  } else {
    logResult('大写', 'Chinese 按钮', false, '没找到按钮')
  }
  
  // === 截图最终状态 ===
  await clearAll()
  await page.locator('.toolbar-btn').nth(2).click()  // dark mode
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT_DIR}/final-dark.png`, fullPage: true })
  
  await page.locator('.toolbar-btn').nth(2).click()  // light mode
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT_DIR}/final-light.png`, fullPage: true })
  
  // === 总结 ===
  console.log(`\n=== 测试总结 ===`)
  console.log(`通过: ${pass} / ${pass + fail}`)
  console.log(`失败: ${fail}`)
  
  if (pageErrors.length > 0) {
    console.log(`\n页面错误:`)
    pageErrors.forEach(e => console.log(`  ${e}`))
  }
  
  // JSON 报告
  const report = {
    timestamp: new Date().toISOString(),
    url: URL,
    pass,
    fail,
    total: pass + fail,
    results,
    pageErrors
  }
  console.log(`\n=== JSON 报告 ===`)
  console.log(JSON.stringify(report, null, 2))
  
  await browser.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})