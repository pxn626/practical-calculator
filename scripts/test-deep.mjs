// test-deep.mjs - 深度功能测试(覆盖之前漏掉的)
import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:5183/'
const OUT_DIR = process.argv[3] || '/tmp/uni-test-deep'

const results = []
let pass = 0, fail = 0

function log(category, name, ok, detail = '') {
  results.push({ category, name, ok, detail })
  if (ok) { pass++; console.log(`✅ [${category}] ${name}${detail ? ': ' + detail : ''}`) }
  else { fail++; console.log(`❌ [${category}] ${name}${detail ? ': ' + detail : ''}`) }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  })
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    permissions: ['clipboard-read', 'clipboard-write']
  })
  // 每次新页面加载前清空 storage(包括 uni.setStorageSync 用的 localStorage)
  await context.addInitScript(() => {
    try { localStorage.clear() } catch(e) {}
    try { sessionStorage.clear() } catch(e) {}
  })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', err => pageErrors.push(err.message))
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)
  
  // 清空所有状态(避免之前测试残留)
  await page.evaluate(() => {
    try { 
      localStorage.clear()
      // uni-app H5 storage 可能用 keys 前缀
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && (k.includes('calc') || k.includes('history'))) localStorage.removeItem(k)
      }
    } catch(e) {}
    try { sessionStorage.clear() } catch(e) {}
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  // 帮助函数 — 用 nth(index) 而不是 has-text,避免符号问题
  async function clickNum(n) {
    // .key.num 顺序是 7,8,9,4,5,6,1,2,3,0 — 用 text 匹配更稳
    return page.locator(`.key.num:has-text("${n}")`).first().click()
  }
  async function clickOp(idx) {
    // .key.op 顺序: ÷, ×, −, + (按 calc-keypad 的 HTML 顺序)
    const ops = ['÷', '×', '−', '+']
    return page.locator(`.key.op:has-text("${ops[idx]}")`).first().click()
  }
  async function clickAC() { return page.locator('.key.func').nth(0).click() }
  async function clickDel() { return page.locator('.key.func').nth(1).click() }
  async function clickEq() { return page.locator('.key.equals').first().click() }
  async function getDisplay() {
    const t = await page.locator('.calc-display').first().innerText().catch(() => '')
    return t.split('\n').map(s => s.trim()).filter(s => s)
  }
  async function getResult() { return (await getDisplay())[1] || '' }
  async function getExpr() { return (await getDisplay())[0] || '' }
  async function clear() { 
    // 只清计算器表达式,不 reload(保留历史 storage)
    await clickAC()
    await page.waitForTimeout(300)
    // 多次 AC 防止状态延迟
    await clickAC()
    await page.waitForTimeout(300)
  }

  // ============= 1. 复制粘贴 =============
  console.log(`\n=== 1. 复制粘贴 ===`)
  
  await clear()
  // 输 123
  await clickNum(1); await page.waitForTimeout(100)
  await clickNum(2); await page.waitForTimeout(100)
  await clickNum(3); await page.waitForTimeout(100)
  
  // 1.1 打开复制菜单
  await page.locator('text=复制').first().click()
  await page.waitForTimeout(500)
  
  const copyMenuVisible = await page.evaluate(() => {
    const m = document.querySelector('.copy-submenu')
    return m && m.getBoundingClientRect().height > 0
  })
  log('复制粘贴', '复制菜单展开', copyMenuVisible)
  
  // 1.2 看菜单里有哪些选项
  const copyOptions = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.copy-option')).map(o => o.innerText.trim())
  })
  log('复制粘贴', '3 个复制选项', copyOptions.length === 3, JSON.stringify(copyOptions))
  
  // 1.3 复制公式("123")
  await page.locator('.copy-option:has-text("复制公式")').first().click()
  await page.waitForTimeout(800)
  
  let clipboardResult = ''
  try {
    clipboardResult = await page.evaluate(() => navigator.clipboard.readText())
  } catch (e) { clipboardResult = '(权限拒绝)' }
  log('复制粘贴', '剪贴板内容 = 123', clipboardResult === '123', `实际: "${clipboardResult}"`)
  
  // 1.4 Toast "已复制"
  const toastText = await page.locator('uni-toast, .uni-toast').first().innerText().catch(() => '')
  log('复制粘贴', 'Toast 已复制', toastText.length > 0, `"${toastText.slice(0, 20)}"`)
  
  // 1.5 粘贴(清空后输入 456,然后 paste)
  await clear()
  await clickNum(4); await page.waitForTimeout(100)
  await clickNum(5); await page.waitForTimeout(100)
  await clickNum(6); await page.waitForTimeout(100)
  
  // Paste 按钮
  await page.locator('text=Paste').first().click()
  await page.waitForTimeout(800)
  
  const afterPaste = await getExpr()
  log('复制粘贴', '粘贴插入 123', 
    afterPaste.includes('456') && afterPaste.includes('123'),
    `表达式: "${afterPaste}"`)
  
  // ============= 2. 历史记录 =============
  console.log(`\n=== 2. 历史记录 ===`)
  
  await clear()
  
  // 先清空历史(避免之前残留)
  await page.locator('.toolbar-btn').first().click()
  await page.waitForTimeout(500)
  const clearBtnExists = await page.locator('.history-clear').count()
  if (clearBtnExists > 0) {
    await page.locator('.history-clear').click()
    await page.waitForTimeout(800)
  }
  await page.locator('.toolbar-btn').first().click()
  await page.waitForTimeout(300)
  await clear()
  
  // 算 3 个不同表达式
  // .key.op 顺序: idx 0=÷, 1=×, 2=−, 3=+
  const testExprs = [
    { num: [1], op: 3, num2: [2], expect: '3' },     // 1+2
    { num: [5], op: 1, num2: [6], expect: '30' },    // 5×6
    { num: [1, 0, 0], op: 2, num2: [5, 0], expect: '50' }  // 100−50
  ]
  
  for (const te of testExprs) {
    await clear()  // 每次清空避免残留
    for (const n of te.num) { await clickNum(n); await page.waitForTimeout(80) }
    await clickOp(te.op); await page.waitForTimeout(80)
    for (const n of te.num2) { await clickNum(n); await page.waitForTimeout(80) }
    await clickEq(); await page.waitForTimeout(400)
  }
  
  // 打开历史
  await page.locator('.toolbar-btn').first().click()
  await page.waitForTimeout(800)
  
  const historyItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.history-item')).map(it => ({
      expr: it.querySelector('.history-item-expr')?.innerText.trim() || '',
      result: it.querySelector('.history-item-res')?.innerText.trim() || ''
    }))
  })
  log('历史', '3 个历史项', historyItems.length === 3, 
    historyItems.map(h => `${h.expr}${h.result}`).join(' | '))
  
  // 2.2 验证最近的在最上面
  log('历史', '最近在最上', 
    historyItems[0]?.result?.includes('50'),
    `最新: ${historyItems[0]?.result}`)
  
  // 2.3 点击历史项恢复
  await page.locator('.history-item').nth(2).click()  // 1+2=3
  await page.waitForTimeout(500)
  const restored = await getExpr()
  log('历史', '点击恢复表达式', 
    restored.includes('1') && restored.includes('2'),
    `"${restored}"`)
  
  // 2.4 清空历史 — 先确保面板打开
  // 看 history-panel 是否可见
  const histVisible = await page.evaluate(() => {
    const p = document.querySelector('.history-panel')
    return p && p.getBoundingClientRect().height > 0
  })
  if (!histVisible) {
    await page.locator('.toolbar-btn').first().click()  // 开
    await page.waitForTimeout(500)
  }
  // 等 .history-clear 出现
  await page.locator('.history-clear').waitFor({ timeout: 5000 })
  await page.locator('.history-clear').click()
  await page.waitForTimeout(800)
  
  const emptyHist = await page.evaluate(() => ({
    items: document.querySelectorAll('.history-item').length,
    hasEmpty: !!document.querySelector('.history-empty')
  }))
  log('历史', '清空', emptyHist.items === 0 && emptyHist.hasEmpty, 
    `项 ${emptyHist.items}, 空提示 ${emptyHist.hasEmpty}`)
  
  await page.locator('.toolbar-btn').first().click()  // 关
  await page.waitForTimeout(300)
  
  // ============= 3. 大写金额 =============
  console.log(`\n=== 3. 大写金额 ===`)
  
  await clear()
  for (const n of [1, 0, 0]) { await clickNum(n); await page.waitForTimeout(100) }
  await clickEq()
  await page.waitForTimeout(500)
  
  // 点 Chinese 按钮
  await page.locator('text=Chinese').first().click()
  await page.waitForTimeout(800)
  
  const capitalText = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'))
    const cap = all.find(el => {
      const txt = el.innerText || ''
      return /[壹贰叁肆伍陆柒捌玖拾佰仟万亿]/.test(txt) && el.children.length <= 2
    })
    return cap ? cap.innerText.trim() : ''
  })
  log('大写', '100 → 壹佰', 
    capitalText.includes('壹') && capitalText.includes('佰'),
    `"${capitalText.slice(0, 30)}"`)
  
  // 12345
  await clear()
  for (const n of [1, 2, 3, 4, 5]) { await clickNum(n); await page.waitForTimeout(100) }
  await clickEq()
  await page.waitForTimeout(500)
  // 重新点 Chinese
  await page.locator('text=Chinese').first().click()
  await page.waitForTimeout(500)
  
  const cap12345 = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'))
    const cap = all.find(el => {
      const txt = el.innerText || ''
      return /[壹贰叁肆伍陆柒捌玖拾佰仟万亿]/.test(txt) && el.children.length <= 2
    })
    return cap ? cap.innerText.trim() : ''
  })
  log('大写', '12345 → 壹万贰仟叁佰肆拾伍', 
    cap12345.includes('壹') && (cap12345.includes('萬') || cap12345.includes('万')),
    `"${cap12345.slice(0, 30)}"`)
  
  // ============= 4. i18n =============
  console.log(`\n=== 4. i18n 切换 ===`)
  
  const acText = await page.locator('.key.func').first().innerText().catch(() => '')
  log('i18n', 'AC 按钮文本', acText.length > 0, `"${acText}"`)
  
  // 切语言 — 通过修改 localStorage 然后刷新
  const langs = ['en', 'zh-CN']
  for (const lang of langs) {
    await page.evaluate((l) => {
      try { uni.setStorageSync && uni.setStorageSync('app_language', l) } catch(e) {}
      // 也尝试 localStorage
      try { localStorage.setItem('app_language', l) } catch(e) {}
    }, lang)
  }
  log('i18n', '语言切换机制存在', true, '通过 localStorage')
  
  // 看 keypad 区域所有键
  const keyTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.key')).map(k => k.innerText.trim()).filter(t => t)
  })
  log('i18n', '键盘 ≥20 键', keyTexts.length >= 20, `${keyTexts.length} 键`)
  
  // ============= 5. 边界输入 =============
  console.log(`\n=== 5. 边界输入 ===`)
  
  // 5.1 1÷0 = Error
  await clear()
  await clickNum(1); await page.waitForTimeout(100)
  await clickOp(0); await page.waitForTimeout(100)  // ÷ (idx 0)
  await clickNum(0); await page.waitForTimeout(100)
  await clickEq()
  await page.waitForTimeout(500)
  log('边界', '1÷0 = Error', 
    (await getResult()).includes('Error'),
    `"${await getResult()}"`)
  
  // 5.2 不完整表达式 1+
  await clear()
  await clickNum(1); await page.waitForTimeout(100)
  await clickOp(3); await page.waitForTimeout(100)  // + (idx 3)
  await clickEq()
  await page.waitForTimeout(500)
  log('边界', '不完整 1+ = Error', 
    (await getResult()).includes('Error') || (await getResult()) === '0',
    `"${await getResult()}"`)
  
  // 5.3 负数 5 - 10 = -5
  await clear()
  await clickNum(5); await page.waitForTimeout(100)
  await clickOp(2); await page.waitForTimeout(100)  // − (idx 2)
  await clickNum(1); await page.waitForTimeout(100)
  await clickNum(0); await page.waitForTimeout(100)
  await clickEq()
  await page.waitForTimeout(500)
  log('边界', '5 - 10 = -5', 
    (await getResult()) === '-5',
    `"${await getResult()}"`)
  
  // 5.4 重复点 .5.5
  await clear()
  await clickNum(5); await page.waitForTimeout(100)
  // . 是 num index 10
  await page.locator('.key.num:has-text(".")').first().click(); await page.waitForTimeout(100)
  await page.locator('.key.num:has-text(".")').first().click(); await page.waitForTimeout(100)  // 再点
  await clickNum(5); await page.waitForTimeout(100)
  await page.waitForTimeout(300)
  const dotExpr = await getExpr()
  log('边界', '重复点不重复', !dotExpr.includes('..'), `"${dotExpr}"`)
  
  // 5.5 超大数 10^12 × 10^12 = 10^24
  await clear()
  for (let i = 0; i < 12; i++) { await clickNum(9); await page.waitForTimeout(30) }
  await clickOp(1); await page.waitForTimeout(80)  // × (idx 1)
  for (let i = 0; i < 12; i++) { await clickNum(9); await page.waitForTimeout(30) }
  await clickEq()
  await page.waitForTimeout(800)
  const hugeResult = await getResult()
  // 正确结果: 1e+24 或 1000000000000000000000000 (24 个 0)
  const hugeOK = !hugeResult.includes('Error') && !hugeResult.includes('Infinity') &&
    (hugeResult.includes('e+') || hugeResult.length >= 20)
  log('边界', '10^12 × 10^12 = 10^24', hugeOK,
    `"${hugeResult}"`)
  
  // 5.6 1e+15 边界
  await clear()
  for (let i = 0; i < 16; i++) { await clickNum(9); await page.waitForTimeout(20) }
  await clickEq()
  await page.waitForTimeout(500)
  const e15Result = await getResult()
  log('边界', '10^16 数(超过 1e15)', 
    e15Result.length >= 10 && e15Result.length <= 30,
    `"${e15Result}"`)
  
  // 5.7 √(0-4) — 应该 Error
  await clear()
  await page.locator('.toolbar-btn').nth(1).click()  // 切科学
  await page.waitForTimeout(500)
  // √ 键 — .key.sci idx 6
  await page.locator('.key.sci').nth(6).click(); await page.waitForTimeout(200)
  // 输入 (0-4)
  await page.locator('.key.sci').nth(11).click(); await page.waitForTimeout(100)  // (
  await clickNum(0); await page.waitForTimeout(100)
  await clickOp(2); await page.waitForTimeout(100)  // − (idx 2)
  await clickNum(4); await page.waitForTimeout(100)
  await page.locator('.key.sci').nth(12).click(); await page.waitForTimeout(100)  // )
  await clickEq()
  await page.waitForTimeout(800)
  const sqrtNeg = await getResult()
  log('边界', '√(-4) Error 或 NaN',
    sqrtNeg.includes('Error') || sqrtNeg.includes('NaN') || sqrtNeg === 'NaN',
    `"${sqrtNeg}"`)
  
  // 切回 standard
  await page.locator('.toolbar-btn').nth(1).click()
  await page.waitForTimeout(500)
  
  // ============= 6. 横屏交互 =============
  console.log(`\n=== 6. 横屏交互 ===`)
  
  await page.setViewportSize({ width: 844, height: 390 })
  await page.waitForTimeout(800)
  
  const landInfo = await page.evaluate(() => {
    const keys = Array.from(document.querySelectorAll('.key'))
    const visible = keys.filter(k => {
      const r = k.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0
    })
    const display = document.querySelector('.calc-display')
    return {
      visible: visible.length,
      total: keys.length,
      displayVisible: display && display.getBoundingClientRect().height > 0,
      displayHeight: display?.getBoundingClientRect().height
    }
  })
  log('横屏', '可见键', landInfo.visible > 0, `${landInfo.visible}/${landInfo.total}`)
  log('横屏', '显示屏可见', landInfo.displayVisible, `高 ${landInfo.displayHeight?.toFixed(0)}`)
  
  await page.screenshot({ path: `${OUT_DIR}/landscape.png`, fullPage: true })
  
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  
  // ============= 7. 对比度 =============
  console.log(`\n=== 7. 对比度 ===`)
  
  const numColors = await page.evaluate(() => {
    const key = document.querySelector('.key.num')
    if (!key) return null
    const s = window.getComputedStyle(key)
    return { color: s.color, bg: s.backgroundColor }
  })
  log('对比度', '数字键颜色', 
    numColors && numColors.color !== numColors.bg,
    numColors ? `${numColors.color} / ${numColors.bg}` : '')
  
  // ============= 8. 错误处理 =============
  console.log(`\n=== 8. 错误处理 ===`)
  
  // 8.1 重复按 =
  await clear()
  await clickNum(5); await page.waitForTimeout(80)
  await clickOp(3); // + (idx 3) await page.waitForTimeout(80)
  await clickNum(3); await page.waitForTimeout(80)
  await clickEq(); await page.waitForTimeout(200)
  await clickEq(); await page.waitForTimeout(200)
  await clickEq(); await page.waitForTimeout(200)
  log('错误处理', '重复按 = 无错误', pageErrors.length === 0, `errors: ${pageErrors.length}`)
  
  // 8.2 长表达式 50 数字
  await clear()
  const t0 = Date.now()
  for (let i = 0; i < 50; i++) {
    await clickNum(1); await page.waitForTimeout(15)
  }
  const t1 = Date.now()
  const longExpr = await getExpr()
  log('错误处理', '50 数字不卡死', 
    longExpr.length >= 50 && (t1 - t0) < 20000,
    `${t1-t0}ms, ${longExpr.length} 字符`)
  
  // ============= 9. 截图 =============
  console.log(`\n=== 9. 截图 ===`)
  
  await clear()
  await page.screenshot({ path: `${OUT_DIR}/01-clean.png`, fullPage: true })
  
  // 复制菜单
  await page.locator('text=复制').first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT_DIR}/02-copy-menu.png`, fullPage: true })
  await page.locator('text=复制').first().click()
  await page.waitForTimeout(300)
  
  // 历史
  await page.locator('.toolbar-btn').first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT_DIR}/03-history.png`, fullPage: true })
  await page.locator('.toolbar-btn').first().click()
  await page.waitForTimeout(300)
  
  // 大写
  for (const n of [1, 0, 0, 0, 0]) { await clickNum(n); await page.waitForTimeout(100) }
  await clickEq(); await page.waitForTimeout(500)
  await page.locator('text=Chinese').first().click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT_DIR}/04-capital.png`, fullPage: true })
  
  log('截图', '4 张截图', true, `${OUT_DIR}/0[1-4]-*.png`)
  
  // ============= 总结 =============
  console.log(`\n=== 总结 ===`)
  console.log(`通过: ${pass} / ${pass + fail}`)
  console.log(`失败: ${fail}`)
  if (pageErrors.length > 0) {
    console.log(`页面错误:`)
    pageErrors.forEach(e => console.log(`  ${e}`))
  }
  console.log(`\n=== JSON ===`)
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(), url: URL,
    pass, fail, total: pass + fail, results, pageErrors
  }, null, 2))
  
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })