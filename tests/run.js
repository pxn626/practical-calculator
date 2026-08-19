#!/usr/bin/env node
/**
 * Test runner — practical-calculator
 * 用法: node tests/run.js
 */

import * as chinese from "./test-chinese.js"
import * as calculator from "./test-calculator.js"

const results = []
results.push(chinese.run())
results.push(calculator.run())

const total = results.reduce(
  (acc, r) => ({ pass: acc.pass + r.pass, fail: acc.fail + r.fail }),
  { pass: 0, fail: 0 }
)

console.log(`\n${"=".repeat(40)}`)
console.log(`总计: 通过 ${total.pass} / 失败 ${total.fail}`)

process.exit(total.fail === 0 ? 0 : 1)