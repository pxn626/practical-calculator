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
  const normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/\bln\b/g, 'log')
    .replace(/(\d+(?:\.\d+)?)\s*\^/g, '$1**')
    // 三角函数自动添加度数转换
    .replace(/\bsin\(([^)]+)\)/g, 'sin(($1) * pi / 180)')
    .replace(/\bcos\(([^)]+)\)/g, 'cos(($1) * pi / 180)')
    .replace(/\btan\(([^)]+)\)/g, 'tan(($1) * pi / 180)')

  try {
    const result = math.evaluate(normalized)
    return formatNumber(result)
  } catch (e) {
    console.error('evaluate failed:', e)
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
