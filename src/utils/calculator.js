/**
 * 计算器核心引擎
 * 支持: 标准运算 + 科学计算
 * 使用: math.js 库 (原生支持 ^ 幂运算)
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
 *
 * 设计原则:
 * - mathjs 原生支持 ^ 幂运算,直接保留
 * - mathjs 原生支持 sqrt,直接保留 (√ 字符已转成 sqrt)
 * - 三角函数默认弧度,我们转成度数
 * - 不做激进归一化(避免破坏表达式)
 */
export function evaluate(expr) {
  if (!expr || expr.trim() === '') return '0'

  // 第一步: 替换人类友好的符号为 math.js 符号
  const normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/\bln\b/g, 'log')

  // 第二步: 三角函数转弧度
  // 用临时占位符避免重复匹配
  let s = normalized
    .replace(/\bsin\(([^)]*)\)/g, '___SIN___($1)')
    .replace(/\bcos\(([^)]*)\)/g, '___COS___($1)')
    .replace(/\btan\(([^)]*)\)/g, '___TAN___($1)')

  s = s
    .replace(/___SIN___\(([^)]*)\)/g, 'sin(($1) * pi / 180)')
    .replace(/___COS___\(([^)]*)\)/g, 'cos(($1) * pi / 180)')
    .replace(/___TAN___\(([^)]*)\)/g, 'tan(($1) * pi / 180)')

  try {
    const result = math.evaluate(s)
    return formatNumber(result)
  } catch (e) {
    // 表达式不完整时 (用户输入到一半) 返回 'Error' 静默
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