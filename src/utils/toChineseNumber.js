/**
 * 数字转中文大写（人民币大写）
 * 
 * 简单可靠的算法: 从左到右逐位处理
 */

const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"]
const INT_UNITS = ["", "拾", "佰", "仟"]
const BIG_UNITS = ["", "万", "亿", "兆", "京"]
const DEC_UNITS = ["角", "分", "厘", "毫"]

/**
 * 把整数部分(任意大,字符串形式)转中文
 * str: 数字字符串,如 "1234567890"
 */
function intToChinese(num) {
  if (num === 0 || num === "0") return "零"

  const str = Math.abs(num).toString()
  const len = str.length
  let result = ""
  let lastWasZero = true  // 初始为 true,这样开头的 0 不会产生 "零"

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i])
    // 位权: 从右数 0 开始,位置 = len - i - 1
    const pos = len - i - 1
    // 大单位 index: 每 4 位一组
    const bigUnitIdx = Math.floor(pos / 4)
    // 组内单位(0/1/2/3)
    const unitIdx = pos % 4

    if (digit === 0) {
      lastWasZero = true
      // 如果当前位置是大单位位置(万/亿/兆),且后面还有数字,需要输出大单位
      if (unitIdx === 0 && i < len - 1) {
        // 找到下一个非零位的索引
        let nextNonZero = -1
        for (let j = i + 1; j < len; j++) {
          if (parseInt(str[j]) !== 0) {
            nextNonZero = j
            break
          }
        }
        if (nextNonZero !== -1) {
          // 添加大单位(但不重复 "零零")
          if (!result.endsWith("零")) {
            result += BIG_UNITS[bigUnitIdx]
            // 标记大单位已输出(避免后面重复)
            lastWasZero = true  // 让下一个非零不会产生 "零"
          } else if (i + 1 < len && nextNonZero !== -1) {
            // result 已以零结尾,但大单位还没输出(因为前面有零)
            // 实际上这种情况只有全部是0,我们已经return了
            // 跳过
          }
        }
      }
    } else {
      // 非零位
      if (lastWasZero && result && !result.endsWith("零")) {
        // 前一位是 0 且 result 非空,加 "零"
        result += "零"
      }
      // 大单位需要在这里输出吗? 不,因为大单位在它"管辖"的位上
      // 例: 1234万 = "壹仟贰佰叁拾肆万"
      //     在 unitIdx=0 的位置输出 BIG_UNITS
      // 但只在 unitIdx=0 且 digit 非零时输出
      result += DIGITS[digit] + INT_UNITS[unitIdx]
      if (unitIdx === 0) {
        // 大单位: 万/亿/兆
        result += BIG_UNITS[bigUnitIdx]
      }
      lastWasZero = false
    }
  }

  // 去除末尾的零(保险)
  while (result.endsWith("零")) {
    result = result.slice(0, -1)
  }

  return result
}

/**
 * 小数部分转中文(角/分/厘/毫)
 */
function decToChinese(decPart) {
  if (decPart === 0) return ""

  const decStr = decPart.toFixed(4).slice(2) // "5500"
  let res = ""
  let lastWasZero = true

  // 找到第一个非零位
  let firstNonZero = -1
  for (let i = 0; i < decStr.length; i++) {
    if (parseInt(decStr[i]) !== 0) {
      firstNonZero = i
      break
    }
  }

  if (firstNonZero === -1) return ""

  for (let i = firstNonZero; i < decStr.length && i < DEC_UNITS.length; i++) {
    const d = parseInt(decStr[i])
    if (d === 0) {
      if (!lastWasZero && i < DEC_UNITS.length - 1) {
        res += "零"
      }
      lastWasZero = true
    } else {
      if (i > firstNonZero && lastWasZero && !res.endsWith("零")) {
        res += "零"
      }
      res += DIGITS[d] + DEC_UNITS[i]
      lastWasZero = false
    }
  }

  // 关键修复: 如果起始位置 firstNonZero > 0,需要补零
  // 例: 0.05 → firstNonZero=1, 但角位是 0, 分位是 5 → 输出 "零伍分"
  if (firstNonZero > 0) {
    res = "零" + res
  }

  while (res.endsWith("零")) {
    res = res.slice(0, -1)
  }

  return res
}

/**
 * 数字转中文大写金额(主函数)
 */
export function toChineseCapital(num) {
  if (typeof num === "string") num = parseFloat(num)
  if (typeof num !== "number" || isNaN(num)) return ""

  if (!isFinite(num)) return num > 0 ? "正无穷" : "负无穷"

  const negative = num < 0
  const abs = Math.abs(num)
  const intPart = Math.floor(abs)
  const decPart = abs - intPart

  let result = ""
  if (negative) result += "负"

  if (intPart === 0 && decPart > 0) {
    result += "零元"
    // decToChinese 会加 leading "零"(因为 firstNonZero > 0),需要去掉避免 "零元零X分"
  } else {
    result += intToChinese(intPart) + "元"
  }

  const decStr = decToChinese(decPart)
  if (!decStr) {
    result += "整"
  } else {
    // 如果 intPart === 0 且 decStr 以 "零" 开头,去掉 leading "零" 避免 "零元零X分"
    if (intPart === 0 && decStr.startsWith("零")) {
      result += decStr.slice(1)
    } else {
      result += decStr
    }
  }

  return result
}

/**
 * 简化版 - 数字转中文(不含金额单位)
 */
export function toChineseNumber(num) {
  if (typeof num === "string") num = parseFloat(num)
  if (typeof num !== "number" || isNaN(num)) return ""
  return intToChinese(Math.floor(Math.abs(num)))
}
