// test-h5.mjs - 用 playwright headless chromium 测试 H5 页面
// 用法:
//   node test-h5.mjs <URL> <输出 PNG 路径> [<等待秒数>]
// 例子:
//   node test-h5.mjs http://192.168.1.187:5183/ /tmp/uni-test-h5.png 5

import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:5183/'
const OUT = process.argv[3] || '/tmp/uni-test-h5.png'
const WAIT_SECONDS = parseInt(process.argv[4] || '5', 10)

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },  // iPhone 14 Pro
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  })
  
  const page = await context.newPage()
  
  // 收集 console log
  const consoleLogs = []
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
  })
  
  // 收集 page errors
  const errors = []
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}\n${err.stack || ''}`)
  })
  
  // 收集 network errors
  const networkErrors = []
  page.on('requestfailed', req => {
    networkErrors.push(`REQ FAILED: ${req.url()} - ${req.failure()?.errorText}`)
  })
  
  try {
    console.log(`[test-h5] 访问 ${URL}`)
    const response = await page.goto(URL, { 
      waitUntil: 'networkidle',
      timeout: 30000
    })
    console.log(`[test-h5] HTTP ${response?.status()} ${response?.statusText()}`)
    
    // 等待 JS 渲染
    await page.waitForTimeout(WAIT_SECONDS * 1000)
    
    // 截图全页
    await page.screenshot({ path: OUT, fullPage: true })
    console.log(`[test-h5] 截图保存到 ${OUT}`)
    
    // 抓页面文本(看渲染了什么)
    const bodyText = await page.locator('body').innerText().catch(() => '(no body text)')
    console.log(`\n[test-h5] === 页面文本 ===\n${bodyText}\n=== 结束 ===\n`)
    
    // 抓 DOM 结构(关键节点)
    const dom = await page.evaluate(() => {
      const title = document.title
      const appEl = document.querySelector('#app')
      const hasContent = appEl && appEl.children.length > 0
      const viewCount = document.querySelectorAll('view, div').length
      const textCount = document.querySelectorAll('text, span, button').length
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).slice(0, 30)
      return { title, hasContent, appChildren: appEl?.children.length, viewCount, textCount, buttons }
    })
    console.log(`[test-h5] DOM 结构:`)
    console.log(JSON.stringify(dom, null, 2))
    
  } catch (err) {
    console.error(`[test-h5] ERROR: ${err.message}`)
    console.error(err.stack)
  }
  
  // 输出 console logs
  console.log(`\n[test-h5] === Console 日志(${consoleLogs.length} 条) ===`)
  consoleLogs.forEach(log => console.log(log))
  
  if (errors.length > 0) {
    console.log(`\n[test-h5] === 页面错误(${errors.length} 条) ===`)
    errors.forEach(err => console.log(err))
  }
  
  if (networkErrors.length > 0) {
    console.log(`\n[test-h5] === 网络错误(${networkErrors.length} 条) ===`)
    networkErrors.forEach(err => console.log(err))
  }
  
  await browser.close()
  console.log(`\n[test-h5] 完成`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})