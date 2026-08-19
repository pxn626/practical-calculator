/**
 * 数字转中文大写（人民币大写）
 * 用于:金额发票、合同等财务场景
 */

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const UNITS = ['', '拾', '佰', '仟']
const BIG_UNITS = ['', '万', '亿', '兆']
const DECIMAL_UNITS = ['角', '分', '厘', '毫']

/**
 * 整数部分转中文
 */
function intToChinese(num) {
  if (num === 0) return '零'
  const str = Math.abs(num).toString()
  const len = str.length
  let result = ''
  let zeroFlag = false

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i])
    const pos = len - i - 1 // 从右边数的位置
    const bigUnitPos = Math.floor(pos / 4)
    const unitPos = pos % 4

    if (digit === 0) {
      zeroFlag = true
    } else {
      if (zeroFlag) {
        result += '零'
        zeroFlag = false
      }
      result += DIGITS[digit] + UNITS[unitPos]
    }

    // 大单位
    if (unitPos === 0 && bigUnitPos > 0) {
      const bigUnit = BIG_UNITS[bigUnitPos]
      // 检查是否需要 "零" 前缀
      if (digit === 0 && result.endsWith('零')) {
        result = result.slice(0, -1) + bigUnit
      } else {
        result += bigUnit
      }
    }
  }

  return result
}

/**
 * 小数部分转中文
 */
function decToChinese(num) {
  if (num === 0) return ''
  const str = num.toString().slice(2) // 去掉 "0."
  let result = ''
  for (let i = 0; i < str.length && i < DECIMAL_UNITS.length; i++) {
    const digit = parseInt(str[i])
    if (digit !== 0) {
      result += DIGITS[digit] + DECIMAL_UNITS[i]
    }
  }
  return result
}

/**
 * 数字转中文大写金额
 * @param {number|string} num - 数字
 * @returns {string} 中文大写
 */
export function toChineseCapital(num) {
  if (typeof num === 'string') num = parseFloat(num)
  if (typeof num !== 'number' || isNaN(num)) return ''

  const negative = num < 0
  const abs = Math.abs(num)
  const intPart = Math.floor(abs)
  const decPart = abs - intPart

  let result = ''
  if (negative) result += '负'

  result += intToChinese(intPart) + '元'

  if (decPart === 0) {
    result += '整'
  } else {
    const decStr = decToChinese(abs)
    if (decStr) {
      // 不补零
      result += decStr
    }
  }

  return result
}

/**
 * 简化版 - 数字转中文（不含金额单位）
 */
export function toChineseNumber(num) {
  if (typeof num === 'string') num = parseFloat(num)
  if (typeof num !== 'number' || isNaN(num)) return ''
  return intToChinese(Math.floor(Math.abs(num)))
}
