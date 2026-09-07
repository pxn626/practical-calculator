/**
 * 计算器核心 evaluate() 测试
 * 覆盖: 标准运算 + 科学运算 + log 双参数 + edge case
 */

import assert from "node:assert/strict"
import { evaluate } from "../src/utils/calculator.js"

function expect(name, actual, expected, tolerance = 0.01) {
  const ok = expected === "Error"
    ? actual === "Error"
    : !isNaN(parseFloat(actual)) && Math.abs(parseFloat(actual) - parseFloat(expected)) < tolerance
  if (ok) {
    console.log(`✅ ${name}`)
    return true
  }
  console.log(`❌ ${name}`)
  console.log(`   实际:   "${actual}"`)
  console.log(`   期望:   "${expected}"`)
  return false
}

export function run() {
  console.log("\n== evaluate() 标准运算 ==")
  let pass = 0, fail = 0
  const t = (name, actual, expected, tol = 0.01) => {
    if (expect(name, actual, expected, tol)) pass++; else fail++
  }

  // === 标准四则 ===
  t("1+1",        evaluate("1+1"),        "2")
  t("2*3",        evaluate("2*3"),        "6")
  t("10/4",       evaluate("10/4"),       "2.5")
  t("100-30",     evaluate("100-30"),     "70")

  // === 友好符号 ===
  t("×",          evaluate("2×3"),        "6")
  t("÷",          evaluate("10÷4"),       "2.5")
  t("−",          evaluate("5−2"),        "3")

  // === π / e ===
  t("π",          evaluate("π"),          "3.1415926536")
  t("e",          evaluate("e"),          "2.7182818285")

  // === 平方 sq 按钮 ^(2) ===
  t("4^(2)",      evaluate("4^(2)"),      "16")
  t("5^(2)",      evaluate("5^(2)"),      "25")
  t("(2+3)^(2)",  evaluate("(2+3)^(2)"),  "25")

  // === 几次方 ^ ===
  t("4^2",        evaluate("4^2"),        "16")
  t("2^10",       evaluate("2^10"),       "1024")
  t("5^3",        evaluate("5^3"),        "125")
  t("10^6",       evaluate("10^6"),       "1000000")
  t("4^(2+3)",    evaluate("4^(2+3)"),    "1024")
  t("(2+3)^(2+1)",evaluate("(2+3)^(2+1)"),"125")
  t("(2*3)^(2+1)",evaluate("(2*3)^(2+1)"),"216")

  // === 开根号 √ ===
  t("√(9)",       evaluate("√(9)"),       "3")
  t("√(16)",      evaluate("√(16)"),      "4")
  t("√(25)",      evaluate("√(25)"),      "5")
  t("9√(16)",     evaluate("9√(16)"),     "36")  // 9 × √16 = 9 × 4

  console.log("\n== evaluate() 对数 ==")
  // === 单参数 log = log10 (常用对数,中国教科书标准) ===
  t("log(100)",   evaluate("log(100)"),   "2")
  t("log(10)",    evaluate("log(10)"),    "1")
  t("log(1000)",  evaluate("log(1000)"),  "3")

  // === ln = 自然对数 ===
  t("ln(e)",      evaluate("ln(e)"),      "1")
  t("ln(2)",      evaluate("ln(2)"),      "0.6931471806")
  t("ln(10)",     evaluate("ln(10)"),     "2.302585093")

  // === 双参数 log(a, b) = log_a(b) (中国教科书 log_a(b)) ===
  t("log(2, 8)",  evaluate("log(2, 8)"),  "3")    // log₂(8) = 3
  t("log(10, 100)", evaluate("log(10, 100)"), "2")  // log₁₀(100) = 2
  t("log(3, 27)", evaluate("log(3, 27)"), "3")    // log₃(27) = 3
  t("log(5, 125)", evaluate("log(5, 125)"), "3")  // log₅(125) = 3
  t("log(2, 16)", evaluate("log(2, 16)"), "4")    // log₂(16) = 4

  console.log("\n== evaluate() 三角函数(度数) ==")
  t("sin(30)",    evaluate("sin(30)"),    "0.5")   // sin(30°) = 0.5
  t("cos(60)",    evaluate("cos(60)"),    "0.5")   // cos(60°) = 0.5
  t("tan(45)",    evaluate("tan(45)"),    "1")     // tan(45°) = 1
  t("sin(90)",    evaluate("sin(90)"),    "1")     // sin(90°) = 1

  console.log(`\n通过: ${pass}/${pass + fail}`)
  return { pass, fail }
}