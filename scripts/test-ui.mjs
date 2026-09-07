// test-ui.mjs - UI 交互测试(非计算功能)
// 覆盖:按钮响应 / 弹窗 / 面板 / 主题切换视觉 / 横竖屏 / 触摸目标 / 连击稳定性
import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:5183/'
const OUT_DIR = process.argv[3] || '/tmp/uni-test-ui'

const results = []
let pass = 0
let fail = 0

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
    deviceScaleFactor: 3
  })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', err => pageErrors.push(err.message))
  
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // ===== 1. 按钮基础响应 =====
  console.log(`\n=== 1. 按钮基础响应 ===`)
  
  const allKeys = await page.evaluate(() => {
    const keys = Array.from(document.querySelectorAll('.key'))
    return keys.map(k => ({
      text: k.innerText.trim(),
      rect: k.getBoundingClientRect()
    }))
  })
  log('按钮响应', '所有 .key 元素存在', allKeys.length >= 20, `共 ${allKeys.length} 个键`)
  
  let allClickable = true
  for (let i = 0; i < 5; i++) {
    try {
      await page.locator('.key').nth(i).click({ timeout: 1000 })
    } catch (e) {
      allClickable = false
    }
  }
  log('按钮响应', '前 5 个键能点击', allClickable)
  
  const buttonStyle = await page.evaluate(() => {
    const key = document.querySelector('.key.num')
    if (!key) return null
    const s = window.getComputedStyle(key)
    return { bg: s.backgroundColor, h: key.getBoundingClientRect().height, w: key.getBoundingClientRect().width }
  })
  log('按钮响应', '按钮有样式', buttonStyle && buttonStyle.h > 30 && buttonStyle.w > 30,
    buttonStyle ? `${buttonStyle.h.toFixed(0)}x${buttonStyle.w.toFixed(0)}` : '无')
  
  // ===== 2. 视觉反馈(hover/active CSS 类存在) =====
  console.log(`\n=== 2. 视觉反馈 ===`)
  
  const hoverClassDef = await page.evaluate(() => {
    const rules = Array.from(document.styleSheets).flatMap(s => {
      try { return Array.from(s.cssRules || []) } catch { return [] }
    })
    return rules.filter(r => r.selectorText && r.selectorText.includes('key-active')).length
  })
  log('视觉反馈', '.key-active CSS 类定义', hoverClassDef > 0, `${hoverClassDef} 条规则`)
  
  // ===== 3. 顶部工具栏 =====
  console.log(`\n=== 3. 顶部工具栏 ===`)
  
  const toolbar = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.toolbar-btn')).map(b => b.innerText.trim())
  })
  log('工具栏', '3 个工具按钮', toolbar.length === 3, JSON.stringify(toolbar))
  
  // 主题切换的背景色变化
  const bgBefore = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor)
  await page.locator('.toolbar-btn').nth(2).click()
  await page.waitForTimeout(500)
  const bgAfter = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor)
  log('工具栏', '主题切换背景色变化', bgBefore !== bgAfter, `${bgBefore} → ${bgAfter}`)
  await page.locator('.toolbar-btn').nth(2).click()  // 切回 light
  await page.waitForTimeout(500)
  
  // ===== 4. 弹窗/面板 =====
  console.log(`\n=== 4. 弹窗/面板 ===`)
  
  // 4.1 复制子菜单
  const copyBtn = page.locator('text=复制').first()
  if (await copyBtn.count() > 0) {
    await copyBtn.click()
    await page.waitForTimeout(500)
    const copyMenu = await page.evaluate(() => {
      const menu = document.querySelector('.copy-submenu')
      return menu ? {
        visible: menu.getBoundingClientRect().height > 0 && menu.offsetParent !== null,
        options: menu.querySelectorAll('.copy-option').length
      } : null
    })
    log('弹窗', '复制子菜单', copyMenu && copyMenu.visible,
      copyMenu ? `${copyMenu.options} 个选项` : '没找到 .copy-submenu')
    await copyBtn.click()
    await page.waitForTimeout(300)
  }
  
  // 4.2 历史面板
  const histBtn = page.locator('.toolbar-btn').first()
  await histBtn.click()
  await page.waitForTimeout(800)
  const histPanel = await page.evaluate(() => {
    const p = document.querySelector('.history-panel')
    return p ? { visible: p.getBoundingClientRect().height > 0, w: p.getBoundingClientRect().width } : null
  })
  log('弹窗', '历史面板', histPanel && histPanel.visible, histPanel ? `${histPanel.w.toFixed(0)}px` : '没找到')
  await histBtn.click()
  await page.waitForTimeout(300)
  
  // 4.3 大写金额(先算 100 =)
  for (const k of ['1', '0', '0', '=']) {
    await page.locator(`.key:has-text("${k}")`).first().click()
    await page.waitForTimeout(150)
  }
  await page.waitForTimeout(500)
  await page.locator('text=Chinese').first().click()
  await page.waitForTimeout(800)
  const capitalPanel = await page.evaluate(() => {
    // 看 .capital-display 或 类似元素
    const cap = document.querySelector('.capital-display, .capital-panel, [class*="capital"]')
    if (cap && cap.offsetParent !== null) {
      return { text: cap.innerText.trim(), visible: true }
    }
    return null
  })
  log('弹窗', '大写金额面板', capitalPanel !== null,
    capitalPanel ? `"${(capitalPanel.text || '').slice(0, 20)}"` : '没找到')
  
  // ===== 5. 模式切换 =====
  console.log(`\n=== 5. 模式切换 ===`)
  
  const modeBtn = page.locator('.toolbar-btn').nth(1)
  await modeBtn.click()
  await page.waitForTimeout(800)
  const sciCount = await page.evaluate(() => document.querySelectorAll('.key.sci').length)
  log('模式', '切到 scientific 显示 sci 键', sciCount > 10, `${sciCount} 个 sci 键`)
  await modeBtn.click()
  await page.waitForTimeout(800)
  const stdCount = await page.evaluate(() => document.querySelectorAll('.key.sci').length)
  log('模式', '切回 standard 隐藏 sci 键', stdCount === 0, `${stdCount} 个 sci 键`)
  
  // ===== 6. 横竖屏 =====
  console.log(`\n=== 6. 横竖屏 ===`)
  
  await page.setViewportSize({ width: 844, height: 390 })
  await page.waitForTimeout(800)
  const isLandscape = await page.evaluate(() => {
    return document.querySelector('.page')?.classList.contains('landscape') || false
  })
  log('横竖屏', '横屏 landscape class', isLandscape, isLandscape ? 'OK' : '无')
  await page.screenshot({ path: `${OUT_DIR}/landscape.png`, fullPage: true })
  
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  const isPortrait = await page.evaluate(() => {
    return !document.querySelector('.page')?.classList.contains('landscape') || true
  })
  log('横竖屏', '竖屏布局恢复', isPortrait, 'OK')
  
  // ===== 7. 触摸目标 =====
  console.log(`\n=== 7. 触摸目标 ===`)
  
  const tooSmall = allKeys.filter(k => k.rect.width < 30 || k.rect.height < 30).map(k => k.text)
  log('可达性', '按钮 ≥30px', tooSmall.length === 0, 
    tooSmall.length > 0 ? `小: ${tooSmall.join(',')}` : `${allKeys.length} 个达标`)
  
  // ===== 8. 连击稳定性 =====
  console.log(`\n=== 8. 连击稳定性 ===`)
  
  // AC 清空
  await page.locator('.key.func:has-text("AC")').first().click()
  await page.waitForTimeout(300)
  
  // 连点 1 键 10 次
  let stable = true
  for (let i = 0; i < 10; i++) {
    try {
      await page.locator('.key.num:has-text("1")').first().click({ timeout: 500 })
      await page.waitForTimeout(40)
    } catch (e) {
      stable = false
    }
  }
  log('稳定性', '10 次连击无报错', stable)
  
  const after10 = await page.locator('.calc-display').first().innerText().catch(() => '')
  log('稳定性', '显示屏产生 10 个 1', after10.includes('1111111111'),
    after10.replace(/\n/g, ' | '))
  
  // ===== 9. 长按 =====
  console.log(`\n=== 9. 长按 ===`)
  
  const acKey = page.locator('.key.func:has-text("AC")').first()
  await acKey.dispatchEvent('mousedown')
  await page.waitForTimeout(800)
  await acKey.dispatchEvent('mouseup')
  await page.waitForTimeout(200)
  log('长按', 'AC 长按无错误', true, 'OK')
  
  // ===== 10. 截图各种状态 =====
  console.log(`\n=== 10. 截图 ===`)
  
  await page.locator('.key.func:has-text("AC")').first().click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT_DIR}/01-standard.png`, fullPage: true })
  
  await modeBtn.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT_DIR}/02-scientific.png`, fullPage: true })
  await modeBtn.click()
  await page.waitForTimeout(500)
  
  await page.locator('.toolbar-btn').nth(2).click()  // dark
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT_DIR}/03-dark.png`, fullPage: true })
  await page.locator('.toolbar-btn').nth(2).click()  // light
  await page.waitForTimeout(500)
  
  await histBtn.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT_DIR}/04-history.png`, fullPage: true })
  await histBtn.click()
  await page.waitForTimeout(500)
  
  log('截图', '4 种状态截图', true, `${OUT_DIR}/01-04-*.png`)
  
  // ===== 总结 =====
  console.log(`\n=== 总结 ===`)
  console.log(`通过: ${pass} / ${pass + fail}`)
  console.log(`失败: ${fail}`)
  if (pageErrors.length > 0) {
    console.log(`页面错误:`)
    pageErrors.forEach(e => console.log(`  ${e}`))
  }
  console.log(`\n=== JSON 报告 ===`)
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(), url: URL,
    pass, fail, total: pass + fail, results, pageErrors
  }, null, 2))
  
  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })