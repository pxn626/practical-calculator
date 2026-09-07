import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

// 切科学模式一次
await page.locator('.toolbar-btn').nth(1).click()
await page.waitForTimeout(500)

async function runTest(name, keys, expectResult) {
  await page.locator('.key.func:has-text("AC")').first().click()
  await page.waitForTimeout(300)
  
  for (const k of keys) {
    if (k === 'log') await page.locator('.key.sci').nth(3).click()         // append "log("
    else if (k === 'logₐ') await page.locator('.key.sci').nth(4).click()   // append "logₐ("
    else if (k === 'ln') await page.locator('.key.sci').nth(5).click()      // append "ln("
    else if (k === 'sqrt') await page.locator('.key.sci').nth(6).click()    // append "√("
    else if (k === 'e') await page.locator('.key.sci').nth(10).click()       // 'e'
    else if (k === ',') await page.locator('.key.num').nth(11).click()      // ","
    else if (k === ')') await page.locator('.key.sci').nth(12).click()      // ")"
    else if (k === '=') await page.locator('.key.equals').first().click()
    else if (k === '+') await page.locator('.key.op:has-text("+")').first().click()
    else if (k === '-') await page.locator('.key.op:has-text("−")').first().click()
    else if (k === '/') await page.locator('.key.op:has-text("÷")').first().click()
    else if (k === '*') await page.locator('.key.op:has-text("×")').first().click()
    else if (/^\d$/.test(k)) await page.locator(`.key.num:has-text("${k}")`).first().click()
    await page.waitForTimeout(100)
  }
  await page.waitForTimeout(500)
  
  const disp = await page.locator('.calc-display').first().innerText().catch(() => '')
  const lines = disp.split('\n').map(s => s.trim()).filter(s => s)
  const result = lines[1] || ''
  const expr = lines[0] || ''
  
  const ok = !expectResult || result.includes(expectResult)
  console.log(`${ok ? '✅' : '❌'} [${name}] expr="${expr}" result="${result}" expect "${expectResult}"`)
  return ok
}

let pass = 0, total = 0

// log(100)=2 (log10) — log 键已经 append "log(", 所以不要按 (
total++; if (await runTest('log(100)=2', ['log', '1', '0', '0', ')', '='], '2')) pass++
// log(1000)=3
total++; if (await runTest('log(1000)=3', ['log', '1', '0', '0', '0', ')', '='], '3')) pass++
// ln(e)=1
total++; if (await runTest('ln(e)=1', ['ln', 'e', ')', '='], '1')) pass++
// logₐ(2,8)=3
total++; if (await runTest('logₐ(2,8)=3', ['logₐ', '2', ',', '8', ')', '='], '3')) pass++
// logₐ(10,1000)=3
total++; if (await runTest('logₐ(10,1000)=3', ['logₐ', '1', '0', ',', '1', '0', '0', '0', ')', '='], '3')) pass++

console.log(`\n通过: ${pass} / ${total}`)
await browser.close()
process.exit(pass === total ? 0 : 1)
