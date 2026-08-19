import * as chinese from "./test-chinese.js"
import * as calculator from "./test-calculator.js"
import * as onEquals from "./test-evaluate-on-equals.js"
import * as dualLog from "./test-log-dual-args.js"
import * as comma from "./test-comma-key.js"
import * as logabUX from "./test-logab-ux.js"

const results = []
results.push(chinese.run())
results.push(calculator.run())
results.push(onEquals.run())
results.push(dualLog.run())
results.push(comma.run())
results.push(logabUX.run())

const total = results.reduce(
  (acc, r) => ({ pass: acc.pass + r.pass, fail: acc.fail + r.fail }),
  { pass: 0, fail: 0 }
)

console.log(`\n${"=".repeat(40)}`)
console.log(`总计: 通过 ${total.pass} / 失败 ${total.fail}`)
process.exit(total.fail === 0 ? 0 : 1)