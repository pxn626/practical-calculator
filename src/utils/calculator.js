/**
 * 计算器核心引擎
 * 支持: 标准运算 + 科学计算
 * 使用: math.js 库
 */

import * as math from 'mathjs'

/**
 * 数字显示格式化（避免浮点精度问题）
 */
export function formatNumber(num) {
  if (typeof num !== 'number' || !isFinite(num)) {
    return 'Error'
  }
  // 整数
  if (Number.isInteger(num) && Math.abs(num) < 1e15) {
    return num.toString()
  }
  // 浮点数 - 保留 10 位精度
  const fixed = parseFloat(num.toPrecision(10))
  return fixed.toString()
}

/**
 * 表达式求值
 * @param {string} expr - 表达式字符串
 * @returns {string} 结果字符串
 */
export function evaluate(expr) {
  if (!expr || expr.trim() === '') return '0'

  // 替换人类友好的符号为 math.js 符号
  let normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/\bln\b/g, 'log')

  // 三角函数自动添加度数转换
  normalized = normalized
    .replace(/\bsin\(([^)]+)\)/g, 'sin(($1) * pi / 180)')
    .replace(/\bcos\(([^)]+)\)/g, 'cos(($1) * pi / 180)')
    .replace(/\btan\(([^)]+)\)/g, 'tan(($1) * pi / 180)')

  // 处理 x^n 和 x^2
  // 情况1: 数字^数字  → 数字^数字 (mathjs 用 ^ 是 pow)
  // 情况2: 数字^  → pow(数字,  // 用括号补全,等下一个数字
  // 情况3: ^数字  → pow(<前式>,数字) - 实际上是表达式^数字,前面应该补 pow(
  // 情况4: ^2 平方按钮 → ^2 → 由 index.vue 处理,转成 ^(2)
  //
  // 最稳的方式: 找到所有 "数字/)/数字)^数字" 或 "数字^数字",转成 "pow(数字, 数字)"
  //             找到 "数字/" )/^数字"  这种开放形式,转成 "pow(数字, "
  //             找到 "^2" 平方按钮 → 由 index.vue 不再用 ^2,改用 ^(2)
  //
  // 实际方案: 全部用 ^ 字符,在 evaluate 里把 ^ 转成 pow()
  //   数字^数字 → pow(数字, 数字)
  //   数字^     → pow(数字,    (开括号,等下一个数字)
  //   )^数字   → pow(, 数字)   (需要补前操作数,转成 pow(?, 数字)
  //   )^       → pow(,         (待定)

  // 简化: 把数字 ^ 数字 转 pow(数字, 数字)
  // 关键: 数字后面跟 ^ 后面跟数字 (允许空白)
  normalized = normalized.replace(/(\d+(?:\.\d+)?|\([^()]+\))\s*\^\s*(\d+(?:\.\d+)?|\([^()]+\))/g, 'pow($1,$2)')

  // 数字 ^ 后是字母或 ) 的,转 pow(数字,
  // 例: 4^(2+3) → pow(4,(2+3))  // 这条正则不匹配,需要通用方法
  // 例: 4^(2)   → pow(4,(2))   // 同上
  // 例: 4^(     → pow(4,    // 开放形式
  // 处理: 数字^后面跟 ( 直接转 pow(数字,
  normalized = normalized.replace(/(\d+(?:\.\d+)?|\))\s*\^\s*\(/g, 'pow($1,')

  // 处理开放形式: 数字^( 后面没东西,等待用户输入
  // 已经是 pow(数字,  形式,等待用户输入 ) 关闭

  // 处理 ^2 这种纯平方按钮 (^2 字符)
  // index.vue 中 appendFactorial? 实际是 sq 按钮 append '^2'
  // 改成由 index.vue 处理: 点 sq 按钮 = append '^(2)'
  // 所以这里不需要特别处理 ^2

  // 如果 ^ 后面什么都没,或者 ^ 开头,转成 pow(<前式>,2) (平方) - 但前面必须有数
  // 这种 case 已经在 index.vue 改成 ^(2) 处理

  // 剩余情况: 表达式以 ^ 结尾 或 表达式以 ^ 开头 - 应该是错误状态
  // 不处理,让 mathjs 报错

  try {
    const result = math.evaluate(normalized)
    return formatNumber(result)
  } catch (e) {
    console.error('evaluate failed:', e.message, 'expr:', normalized)
    return 'Error'
  }
}

/**
 * 阶乘
 */
export function factorial(n) {
  if (n < 0) return NaN
  if (n > 170) return Infinity
  if (!Number.isInteger(n)) return gamma(n + 1)
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

/**
 * 百分比
 */
export function percent(value) {
  return value / 100
}

/**
 * 正负切换
 */
export function negate(value) {
  return -value
}