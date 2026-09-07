/**
 * 大写转换单元测试
 * 覆盖: 整数部分、小数部分、负数、零、大数、edge case
 */

import assert from "node:assert/strict"
import { toChineseCapital, toChineseNumber } from "../src/utils/toChineseNumber.js"

// 断言 helper: 期望值 vs 实际值,带描述
function expect(name, actual, expected) {
  try {
    assert.strictEqual(actual, expected)
    console.log(`✅ ${name}`)
    return true
  } catch (e) {
    console.log(`❌ ${name}`)
    console.log(`   实际:   "${actual}"`)
    console.log(`   期望:   "${expected}"`)
    return false
  }
}

export function run() {
  console.log("\n== toChineseCapital 测试 ==")
  let pass = 0, fail = 0
  const t = (name, actual, expected) => {
    if (expect(name, actual, expected)) pass++; else fail++
  }

  // === 整数部分 ===
  t("0",          toChineseCapital(0),         "零元整")
  t("1",          toChineseCapital(1),         "壹元整")
  t("10",         toChineseCapital(10),        "壹拾元整")
  t("100",        toChineseCapital(100),       "壹佰元整")
  t("1000",       toChineseCapital(1000),      "壹仟元整")
  t("1234",       toChineseCapital(1234),      "壹仟贰佰叁拾肆元整")

  // === 大数 ===
  t("10000",      toChineseCapital(10000),     "壹万元整")
  t("10000000",   toChineseCapital(10000000),  "壹仟万元整")
  t("100000000",  toChineseCapital(100000000), "壹亿元整")
  t("10000001",   toChineseCapital(10000001),  "壹仟万零壹元整")   // 关键 case: 中间缺零
  t("1234567890", toChineseCapital(1234567890),"壹拾贰亿叁仟肆佰伍拾陆万柒仟捌佰玖拾元整")  // 关键 case: 最高组无前导零

  // === 小数部分 ===
  t("0.5",        toChineseCapital(0.5),       "零元伍角")
  t("0.55",       toChineseCapital(0.55),      "零元伍角伍分")
  t("0.05",       toChineseCapital(0.05),      "零元伍分")
  t("0.01",       toChineseCapital(0.01),      "零元壹分")
  t("1234.5",     toChineseCapital(1234.5),    "壹仟贰佰叁拾肆元伍角")
  t("1234.56",    toChineseCapital(1234.56),   "壹仟贰佰叁拾肆元伍角陆分")
  t("1234.05",    toChineseCapital(1234.05),   "壹仟贰佰叁拾肆元零伍分")  // 关键 case: 小数首零补
  t("1000.5",     toChineseCapital(1000.5),    "壹仟元伍角")

  // === 负数 ===
  t("-1234.56",   toChineseCapital(-1234.56),  "负壹仟贰佰叁拾肆元伍角陆分")

  // === 简化版 toChineseNumber ===
  console.log("\n== toChineseNumber (无单位) 测试 ==")
  t("1234",       toChineseNumber(1234),       "壹仟贰佰叁拾肆")
  t("10000001",   toChineseNumber(10000001),   "壹仟万零壹")

  console.log(`\n通过: ${pass}/${pass + fail}`)
  return { pass, fail }
}