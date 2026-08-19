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
  let normalized = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')

  // 双参数 log(a, b) = log_a(b) = log(b)/log(a)
  // 用占位符避免重复匹配
  let __log_pairs = []
  normalized = normalized.replace(/\blog\(([^,()]+),\s*([^()]+)\)/g, function (match, base, val) {
    const idx = __log_pairs.length
    __log_pairs.push({ base: base.trim(), val: val.trim() })
    return '__LOG_PAIR_' + idx + '__'
  })

  normalized = normalized
    // 单参数 log(x) → log10(x) (中国教科书标准,log 默认以10为底)
    .replace(/\blog\(/g, 'log10(')
    // ln(x) → log(x) (自然对数)
    .replace(/\bln\b/g, 'log')

  // 把双参数 log 占位符展开成 log(b)/log(a)
  __log_pairs.forEach(function (pair, idx) {
    const placeholder = '__LOG_PAIR_' + idx + '__'
    // log_a(b) = log(b)/log(a)
    // 在 mathjs 里 log(b)/log(a) = ln(b)/ln(a)
    normalized = normalized.split(placeholder).join('log(' + pair.val + ')/log(' + pair.base + ')')
  })

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