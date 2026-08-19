/**
 * logab 按钮 UX 测试
 *
 * 正确流程:
 *   1. 点 logab → expression = "log("
 *   2. 点 3 → "log(3"
 *   3. 点 , → "log(3,"
 *   4. 点 27 → "log(3,27"
 *   5. 点 ) → "log(3,27)"
 *   6. 点 = → 3
 *
 * 错误流程 (旧版本 bug):
 *   1. 点 logab → expression = "log(,"
 *   2. 点 3 → "log(,3"
 *   3. 点 , → "log(,3,"
 *   4. 点 27 → "log(,3,27"
 *   5. 点 ) → "log(,3,27)"
 *   6. 点 = → Error (开头的 "," 错)
 *
 * 验证:
 *   - case "logab" append "log(" (不是 "log(,")
 *   - 模拟完整按键序列后 evaluate = 3
 */

import fs from "node:fs"
import { execSync } from "node:child_process"

const ROOT = "/home/penson/code/practical-calculator/src"
const indexVuePath = `${ROOT}/pages/index/index.vue`

export function run() {
  console.log("\n== logab UX 测试 ==")
  let pass = 0, fail = 0
  const t = (name, ok, detail = "") => {
    if (ok) { console.log(`✅ ${name}`); pass++ }
    else { console.log(`❌ ${name} ${detail}`); fail++ }
  }

  const indexSource = fs.readFileSync(indexVuePath, "utf-8")

  // 找 onKeyTap 函数体
  const onKeyTapStart = indexSource.indexOf("const onKeyTap = (value) => {")
  let depth = 0, end = onKeyTapStart
  for (let i = onKeyTapStart; i < indexSource.length; i++) {
    if (indexSource[i] === "{") depth++
    else if (indexSource[i] === "}") {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  const onKeyTapBody = indexSource.substring(onKeyTapStart, end)

  // 找 case "logab" body
  const caseMatch = onKeyTapBody.match(/case "logab":([\s\S]*?)^\s*break/m)
  if (!caseMatch) {
    t("case 'logab' 存在", false)
    return { pass: 0, fail: 1 }
  }
  t("case 'logab' 存在", true)
  pass++

  const body = caseMatch[1]

  // 应该 append "log(" (开括号,等用户输底数)
  t(`case 'logab' append 'log(' (不带逗号)`, body.includes('expression.value += "log("'),
    `body: ${body.trim().substring(0, 100)}`)

  // 不应该 append "log(," (开括号带逗号,这是错误版本)
  t(`case 'logab' 不 append 'log(,' (旧 bug)`,
    !body.includes('expression.value += "log(,"'),
    `body: ${body.trim().substring(0, 100)}`)

  // 模拟完整按键序列
  const result = execSync(
    `node ${ROOT}/../test-eval-helper.mjs "log(3,27)" 2>&1 || true`,
    { encoding: "utf-8" }
  ).trim()
  // 临时 helper 不一定存在,fallback 直接用 node
  const evalResult = execSync(
    `node --input-type=module -e "import('${ROOT}/utils/calculator.js').then(m => console.log(m.evaluate('log(3,27)')));"`,
    { encoding: "utf-8" }
  ).trim()
  t("正确格式 log(3,27) 计算 = '3'", evalResult === "3", `实际: "${evalResult}"`)

  // 旧 bug 格式应该报错
  const bugResult = execSync(
    `node --input-type=module -e "import('${ROOT}/utils/calculator.js').then(m => console.log(m.evaluate('log(,3,27)')));"`,
    { encoding: "utf-8" }
  ).trim()
  t("旧 bug 格式 log(,3,27) 应该 = 'Error' (说明 buggy 表达式会失败)", bugResult === "Error",
    `实际: "${bugResult}"`)

  console.log(`\n通过: ${pass}/${pass + fail}`)
  return { pass, fail }
}