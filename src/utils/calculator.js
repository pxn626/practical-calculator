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
  // 两阶段处理以支持嵌套:
  //   阶段1: 反复 match 内层的双参数 log (val 不含 log()
  //   阶段2: 反复 match 嵌套结构 (val 是占位符 __LOG_PAIR_N__)
  let __log_pairs = []
  let __prev_log = ''
  while (normalized !== __prev_log) {
    __prev_log = normalized
    normalized = normalized.replace(/\blog\(\s*([^,()]+)\s*,\s*([^()]+)\)/g, function (match, base, val) {
      // 如果 val 包含 log(, 跳过让内层先处理
      if (/\blog\(/.test(val)) return match
      const idx = __log_pairs.length
      __log_pairs.push({ base: base.trim(), val: val.trim() })
      return '__LOG_PAIR_' + idx + '__'
    })
  }

  normalized = normalized
    // 单参数 log(x) → log10(x) (中国教科书标准,log 默认以10为底)
    .replace(/\blog\(/g, 'log10(')
    // ln(x) → log(x) (自然对数)
    .replace(/\bln\b/g, 'log')

  // 把双参数 log 占位符展开成 log(b)/log(a)
  // 注意: 必须 反向 处理(从外到内),这样内层的 __LOG_PAIR_0__ 先被外层引用再展开
  // 否则嵌套 log(2, log(2, 16)) 会留下未替换的占位符
  for (let i = __log_pairs.length - 1; i >= 0; i--) {
    const pair = __log_pairs[i]
    const placeholder = '__LOG_PAIR_' + i + '__'
    // log_a(b) = log(b)/log(a) = ln(b)/ln(a)
    normalized = normalized.split(placeholder).join('log(' + pair.val + ')/log(' + pair.base + ')')
  }

  // 三角函数转弧度: 迭代处理,只在最内层三角函数(无嵌套三角函数)乘 π/180
  // 嵌套时外层不乘 π/180,内层已转度数 → mathjs 直接算
  //
  // 例:
  //   sin(45)        → sin((45) * pi / 180)        = sin(45°) = 0.707
  //   sin(cos(45))   → sin(cos((45) * pi / 180))   = sin(cos(45°)) = sin(0.707) ≈ 0.65
  let s = normalized
  let prev = ''
  while (s !== prev) {
    prev = s
    s = s.replace(/\b(sin|cos|tan)\(([^()]+)\)/g, function (match, fn, arg) {
      // 检查 arg 是否包含其他三角函数
      if (/\b(?:sin|cos|tan)\(/.test(arg)) {
        // 嵌套,等内层先转
        return match
      }
      // 最内层,转度数
      return fn + '((' + arg + ') * pi / 180)'
    })
  }

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