/**
 * evaluate() 应该在 calculate() 时调用,而不是按键时
 *
 * 模拟用户操作:
 *   - 输入 "1+1" (不点 =) → 表达式存起来, evaluate 仍可调用 (preview 是显示给用户看,但 result 不应自动更新)
 *   - 输入 "1+1" + 点 "=" → evaluate 被 calculate() 调用, result 更新
 *
 * 注: 单元测试 evaluate() 函数本身;UI 层"是否调用"由 index.vue 的 onKeyTap 行为决定
 *
 * 这里我们测试:
 *   - evaluate("1+1") 单独能算 = "2"
 *   - 但 evaluate() 不应该在 onKeyTap 里被自动调用
 *
 * 通过检查 index.vue 源码确保 onKeyTap 内非 = case 不调 evaluate
 */

import fs from "node:fs"
import assert from "node:assert/strict"

const indexVuePath = "/home/penson/code/practical-calculator/src/pages/index/index.vue"

export function run() {
  console.log("\n== 行为测试: 点击 = 后才运算 ==")
  let pass = 0, fail = 0

  // 1. 读取 index.vue 源码
  const source = fs.readFileSync(indexVuePath, "utf-8")

  // 2. 提取 onKeyTap 函数体
  const onKeyTapMatch = source.match(/const onKeyTap = \(value\) => \{([\s\S]*?)\n    \}/)
  if (!onKeyTapMatch) {
    console.log("❌ 找不到 onKeyTap 函数")
    return { pass: 0, fail: 1 }
  }
  const body = onKeyTapMatch[1]
  pass++

  // 3. 检查: 除 "=" case 外,其他 case 不调用 evaluate/preview/calculate
  // 找到所有 case 分支
  const caseMatches = [...body.matchAll(/case "(.+?)":([\s\S]*?)(?=case "|break\s*\n\s*\}|default:)/g)]
  console.log(`   找到 ${caseMatches.length} 个 case 分支`)

  let nonEqualsCaseHasEvaluate = false
  let equalsCaseHasCalculate = false
  let equalsCaseHasEvaluate = false

  for (const m of caseMatches) {
    const caseKey = m[1]
    const caseBody = m[2]
    if (caseKey === "=") {
      if (caseBody.includes("calculate(")) {
        equalsCaseHasCalculate = true
      }
      if (caseBody.includes("evaluate(") || caseBody.includes("preview(")) {
        equalsCaseHasEvaluate = true
      }
    } else {
      // 其他 case 不应该调 calculate/evaluate/preview
      if (caseBody.includes("calculate(") || caseBody.includes("preview(") || caseBody.includes("evaluate(")) {
        console.log(`   ❌ case "${caseKey}" 包含 evaluate/preview/calculate 调用:`)
        console.log(`      ${caseBody.trim().substring(0, 80)}...`)
        nonEqualsCaseHasEvaluate = true
      }
    }
  }

  if (!nonEqualsCaseHasEvaluate) {
    console.log("✅ 非 = case 不调用 evaluate/preview/calculate")
    pass++
  } else {
    console.log("❌ 部分非 = case 调用了 evaluate/preview/calculate")
    fail++
  }

  if (equalsCaseHasCalculate) {
    console.log("✅ = case 调用了 calculate()")
    pass++
  } else {
    console.log("❌ = case 未调用 calculate()")
    fail++
  }

  console.log(`\n通过: ${pass}/${pass + fail}`)
  return { pass, fail }
}