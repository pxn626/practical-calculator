/**
 * 逗号键测试: keypad 必须有 "," 按钮让用户能输入 log(a, b) 等多参数函数
 */

import fs from "node:fs"
import { execSync } from "node:child_process"

const ROOT = "/home/penson/code/practical-calculator/src"
const indexVuePath = `${ROOT}/pages/index/index.vue`
const keypadPath = `${ROOT}/components/calc-keypad.vue`

export function run() {
  console.log("\n== 逗号键 UX 测试 ==")
  let pass = 0, fail = 0
  const t = (name, ok, detail = "") => {
    if (ok) { console.log(`✅ ${name}`); pass++ }
    else { console.log(`❌ ${name} ${detail}`); fail++ }
  }

  const keypadSource = fs.readFileSync(keypadPath, "utf-8")
  const hasCommaButton = keypadSource.match(/onTap\(['"],['"]\)/)
  t("keypad 渲染逗号按钮 (onTap(','))", !!hasCommaButton)

  const indexSource = fs.readFileSync(indexVuePath, "utf-8")

  // 找 onKeyTap 函数体内 case ','
  const onKeyTapStart = indexSource.indexOf("const onKeyTap = (value) => {")
  if (onKeyTapStart === -1) {
    t("onKeyTap 函数存在", false)
    return { pass: 0, fail: 1 }
  }
  pass++

  // 找 onKeyTap 函数结束 (匹配 {})
  let depth = 0
  let end = onKeyTapStart
  for (let i = onKeyTapStart; i < indexSource.length; i++) {
    if (indexSource[i] === "{") depth++
    else if (indexSource[i] === "}") {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  const onKeyTapBody = indexSource.substring(onKeyTapStart, end)
  const commaCase = onKeyTapBody.match(/case ",\s*":/)
  t("onKeyTap 有 case ','", !!commaCase)

  if (commaCase) {
    // 找 case body: 从 case ",\s*": 开始,到下一个 case 或 break 结束
    const startIdx = commaCase.index
    // 抓 case body: 直到 "break" 结束
    const remaining = onKeyTapBody.substring(startIdx)
    const breakMatch = remaining.match(/case ",\s*":([\s\S]*?)^\s*break/m)
    if (breakMatch) {
      const body = breakMatch[1]
      t("case ',' append ','", body.includes('expression.value += ","') || body.includes("','"),
        `body: ${body.trim().substring(0, 80)}`)
      const hasAutoEval = body.includes("evaluate(") || body.includes("preview(") || body.includes("calculate(")
      t("case ',' 不调用 evaluate/preview/calculate", !hasAutoEval,
        hasAutoEval ? "body 含 evaluate/preview/calculate" : "")
    } else {
      t("case ',' 有 break", false, "找不到 break 终止")
    }
  }

  const zhJson = JSON.parse(fs.readFileSync(`${ROOT}/locales/zh.json`, "utf-8"))
  const enJson = JSON.parse(fs.readFileSync(`${ROOT}/locales/en.json`, "utf-8"))
  t("locales/zh.json 有 keypad.comma", !!(zhJson.keypad && zhJson.keypad.comma))
  t("locales/en.json 有 keypad.comma", !!(enJson.keypad && enJson.keypad.comma))

  const result = execSync(
    `node --input-type=module -e "import('${ROOT}/utils/calculator.js').then(m => console.log(m.evaluate('log(3,27)')));"`,
    { encoding: "utf-8" }
  ).trim()
  t("完整表达式 log(3,27) 算出来 = '3'", result === "3", `实际: "${result}"`)

  console.log(`\n通过: ${pass}/${pass + fail}`)
  return { pass, fail }
}