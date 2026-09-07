/**
 * 边界 / 鲁棒性 测试
 */

import { evaluate } from "../src/utils/calculator.js"
import { toChineseCapital } from "../src/utils/toChineseNumber.js"

function expect(name, actual, expected, tolerance = 0.01) {
  let ok
  if (expected === "Error") {
    ok = actual === "Error"
  } else if (typeof expected === "number") {
    if (typeof actual !== "string") {
      ok = false
    } else {
      const actualNum = parseFloat(actual)
      if (isNaN(actualNum)) {
        ok = false
      } else if (tolerance === 0) {
        ok = actualNum === expected
      } else {
        ok = Math.abs(actualNum - expected) < tolerance
      }
    }
  } else {
    ok = actual === expected
  }
  if (ok) {
    console.log(`✅ ${name}`)
    return true
  } else {
    console.log(`❌ ${name}`)
    console.log(`   实际:   ${JSON.stringify(actual)}`)
    console.log(`   期望:   ${JSON.stringify(expected)}`)
    return false
  }
}

export function run() {
  console.log("\n== 边界 / 鲁棒性 测试 ==")
  let pass = 0, fail = 0
  const t = (name, actual, expected, tol = 0.01) => {
    if (expect(name, actual, expected, tol)) pass++; else fail++
  }

  console.log("\n--- A. 空 / 边界输入 ---")
  t("evaluate('')",          evaluate(""),          "0")
  t("evaluate('   ')",       evaluate("   "),       "0")
  t("evaluate('0')",         evaluate("0"),         "0")
  t("evaluate('0.0')",       evaluate("0.0"),       "0")

  console.log("\n--- B. 除零 / 数学错误 ---")
  t("evaluate('0/0')",       evaluate("0/0"),       "Error")
  t("evaluate('1/0')",       evaluate("1/0"),       "Error")

  console.log("\n--- C. 运算符优先级 ---")
  t("evaluate('2+3*4')",     evaluate("2+3*4"),     14)
  t("evaluate('(2+3)*4')",   evaluate("(2+3)*4"),   20)
  t("evaluate('10-2-3')",    evaluate("10-2-3"),    5)
  t("evaluate('10/2/5')",    evaluate("10/2/5"),    1)

  console.log("\n--- D. 幂运算结合性 ---")
  t("evaluate('2^(3^2)')",   evaluate("2^(3^2)"),   512)
  t("evaluate('(2^3)^2')",   evaluate("(2^3)^2"),   64)

  console.log("\n--- E. 阶乘 ---")
  t("evaluate('5!')",        evaluate("5!"),        120)
  t("evaluate('0!')",        evaluate("0!"),        1)
  t("evaluate('10!')",       evaluate("10!"),       3628800)

  console.log("\n--- F. 嵌套三角函数 ---")
  t("evaluate('sin(0)')",    evaluate("sin(0)"),    0)
  t("evaluate('cos(90)')",   evaluate("cos(90)"),   0)
  t("evaluate('sin(cos(45))')", evaluate("sin(cos(45))"), 0.6496, 0.01)

  console.log("\n--- G. 浮点精度 ---")
  t("evaluate('0.1+0.2')",   evaluate("0.1+0.2"),   0.3)

  console.log("\n--- H. 错误输入 ---")
  t("evaluate('abc')",       evaluate("abc"),       "Error")
  t("evaluate('1++')",       evaluate("1++"),       "Error")
  t("evaluate('()')",        evaluate("()"),        "Error")
  t("evaluate('1,2')",      evaluate("1,2"),       "Error")

  console.log("\n--- I. 大数边界 ---")
  // 15 位整数, < 1e15 原样返回
  t("evaluate('999999999999999')",
    evaluate("999999999999999"), 999999999999999, 0)
  // 1e15 应该走浮点路径
  t("evaluate('1000000000000000')",
    evaluate("1000000000000000"), 1e15, 0)

  console.log("\n--- J. toChineseCapital 边界 ---")
  t("toChineseCapital(NaN)",       toChineseCapital(NaN),       "")
  t("toChineseCapital(Infinity)",  toChineseCapital(Infinity),  "正无穷")
  t("toChineseCapital(-Infinity)", toChineseCapital(-Infinity), "负无穷")
  t("toChineseCapital(undefined)", toChineseCapital(undefined), "")
  // 0.001 元 = 1 厘 (1/1000 元), 不是 1 分 (1/100 元)
  t("toChineseCapital(0.001)",     toChineseCapital(0.001),     "零元壹厘")
  // 0.0001 元 = 1 毫 (1/10000 元)
  t("toChineseCapital(0.0001)",    toChineseCapital(0.0001),    "零元壹毫")

  console.log("\n--- K. log 双参数嵌套 ---")
  // log(2, log(2, 16)) = log₂(log₂(16)) = log₂(4) = 2
  t("evaluate('log(2, log(2, 16))')",
    evaluate("log(2, log(2, 16))"), 2)
  // log(2, log(3, 27)) = log₂(log₃(27)) = log₂(3) ≈ 1.585
  t("evaluate('log(2, log(3, 27))')",
    evaluate("log(2, log(3, 27))"), 1.585, 0.01)

  console.log(`\n通过: ${pass}/${pass + fail}`)
  return { pass, fail }
}