/**
 * 双参数对数 log(a, b) = log_a(b) UX 测试
 */

import fs from "node:fs"
import { execSync } from "node:child_process"

const ROOT = "/home/penson/code/practical-calculator/src"
const indexVuePath = `${ROOT}/pages/index/index.vue`
const keypadPath = `${ROOT}/components/calc-keypad.vue`

export function run() {
  console.log("\n== 双参数对数 UX 测试 ==")
  let pass = 0, fail = 0
  const t = (name, ok, detail = "") => {
    if (ok) { console.log(`✅ ${name}`); pass++ }
    else { console.log(`❌ ${name} ${detail}`); fail++ }
  }

  // 1. evaluate("log(3, 27)") 应该返回 "3"
  const result = execSync(
    `node --input-type=module -e "import('${ROOT}/utils/calculator.js').then(m => console.log(m.evaluate('log(3, 27)')));"`,
    { encoding: "utf-8" }
  ).trim()
  t("evaluate('log(3, 27)') 返回 '3'", result === "3", `实际: "${result}"`)

  // 2. onKeyTap 里有双参数对数 case
  const indexSource = fs.readFileSync(indexVuePath, "utf-8")
  const dualLogCase = indexSource.match(/case "(logab|log_y|logCustom|logN|logY|logBase)"/)
  t("onKeyTap 有双参数对数 case", !!dualLogCase,
    `找到 case: ${dualLogCase ? dualLogCase[1] : "无"}`)

  if (dualLogCase) {
    const caseKey = dualLogCase[1]
    const regex = new RegExp(`case "${caseKey}":([\\s\\S]*?)(?=case "|= break|$)`)
    const m = indexSource.match(regex)
    if (m) {
      const body = m[1]
      t(`case "${caseKey}" append 'log('`, body.includes("log("),
        `body: ${body.trim().substring(0, 100)}`)
      const hasAutoEval = body.includes("evaluate(") || body.includes("preview(") || body.includes("calculate(")
      t(`case "${caseKey}" 不调用 evaluate/preview/calculate`, !hasAutoEval)
    }
  }

  // 3. calc-keypad.vue 应该有一个按钮 emit 这个 key
  const keypadSource = fs.readFileSync(keypadPath, "utf-8")
  const keypadHasDualLogBtn = keypadSource.match(/onTap\(['"](logab|log_y|logCustom|logN|logY|logBase)['"]/)
  t("keypad 有双参数对数按钮", !!keypadHasDualLogBtn,
    `找到: ${keypadHasDualLogBtn ? keypadHasDualLogBtn[1] : "无"}`)

  // 4. locales (zh.json / en.json) 应该有对应的 label
  const zhJson = JSON.parse(fs.readFileSync(`${ROOT}/locales/zh.json`, "utf-8"))
  const enJson = JSON.parse(fs.readFileSync(`${ROOT}/locales/en.json`, "utf-8"))
  const hasZhLabel = zhJson.keypad && (zhJson.keypad.logab || zhJson.keypad.log_y || zhJson.keypad.logN || zhJson.keypad.logBase)
  const hasEnLabel = enJson.keypad && (enJson.keypad.logab || enJson.keypad.log_y || enJson.keypad.logN || enJson.keypad.logBase)
  t("locales/zh.json 有双参数对数 label", !!hasZhLabel,
    `keypad keys: ${zhJson.keypad ? Object.keys(zhJson.keypad).join(", ") : "无 keypad"}`)
  t("locales/en.json 有双参数对数 label", !!hasEnLabel,
    `keypad keys: ${enJson.keypad ? Object.keys(enJson.keypad).join(", ") : "无 keypad"}`)

  console.log(`\n通过: ${pass}/${pass + fail}`)
  return { pass, fail }
}