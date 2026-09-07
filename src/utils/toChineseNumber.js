/**
 * 数字转中文大写（人民币大写）
 */

const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"]
const INT_UNITS = ["", "拾", "佰", "仟"]
const BIG_UNITS = ["", "万", "亿", "兆", "京"]
const DEC_UNITS = ["角", "分", "厘", "毫"]

/**
 * 整数部分转中文
 *
 * 算法: 把整数切成 4 位一组(从右往左),处理每组 0-9999
 *       然后用 sectionToChinese + BIG_UNITS 拼接
 *
 * 例: 1234567890
 *   groups = [12, 3456, 7890]
 *   group[0]=7890 → "柒仟捌佰玖拾" (无 bigUnit)
 *   group[1]=3456 → "叁仟肆佰伍拾陆万"
 *   group[2]=12   → "壹拾贰亿"
 *   拼接: "壹拾贰亿叁仟肆佰伍拾陆万柒仟捌佰玖拾"
 *
 *   10000001
 *   groups = [1, 0, 1]
 *   group[0]=1 → "壹" (无 bigUnit)
 *   group[1]=0 → 0,标记补零
 *   group[2]=1 → "壹万" (bigUnit=万)
 *   结果: "壹万零壹"
 *   等等! 10000001 应该 = "壹仟万零壹元整"
 *   因为 10000001 = 1000万 + 1
 *   所以 groups = [1, 1000] (从右往左: 1, 1000)
 *   group[0]=1 → "壹"
 *   group[1]=1000 → sectionToChinese(1000)="壹仟" + "万" → "壹仟万"
 *   因为 group[1] 后面跟的是 "零壹", 所以 group[1] 本身要补 zero prefix
 *   结果: "壹仟万零壹"
 */
function intToChinese(num) {
  if (num === 0) return "零"

  const str = Math.abs(num).toString()
  const len = str.length
  let result = ""
  let lastWasZero = true  // 初始为 true,这样开头的 0 不会产生 "零"

  // 找出所有非零位的最大位置(用于决定大单位是否输出)
  // 例: 10000001 → 非零位 0 和 7,最大 pos=7,bigUnitIdx=1(万)
  //     10000000 → 非零位 7,最大 pos=7,bigUnitIdx=1(万) → 输出 "壹万"
  //     100000000 → 非零位 8,最大 pos=8,bigUnitIdx=2(亿)

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i])
    const pos = len - i - 1
    const bigUnitIdx = Math.floor(pos / 4)
    const unitIdx = pos % 4

    if (digit === 0) {
      lastWasZero = true
      // 关键修复: 在 unitIdx=0 位置(digit=0 但需要保留大单位信息)
      // 如果后面还有非零位,大单位需要输出
      if (unitIdx === 0 && i < len - 1) {
        // 检查后面是否有非零位
        let hasNonZeroAfter = false
        for (let j = i + 1; j < len; j++) {
          if (parseInt(str[j]) !== 0) {
            hasNonZeroAfter = true
            break
          }
        }
        if (hasNonZeroAfter) {
          // 输出大单位(如果还没输出过)
          if (!result.endsWith(BIG_UNITS[bigUnitIdx])) {
            // 避免重复输出 (如 "亿亿")
            result += BIG_UNITS[bigUnitIdx]
            lastWasZero = true  // 让下一个非零位补零
          }
        }
      }
    } else {
      // 非零位
      if (lastWasZero && result && !result.endsWith("零")) {
        result += "零"
      }
      result += DIGITS[digit] + INT_UNITS[unitIdx]
      // 输出大单位: 单位位置(unitIdx=0) 或这是唯一的非零位
      // 唯一非零位: 后面所有位都是 0
      let isOnlyNonZero = true
      for (let j = i + 1; j < len; j++) {
        if (parseInt(str[j]) !== 0) {
          isOnlyNonZero = false
          break
        }
      }
      if (unitIdx === 0 || (isOnlyNonZero && bigUnitIdx > 0)) {
        // 避免重复输出大单位
        if (!result.endsWith(BIG_UNITS[bigUnitIdx])) {
          result += BIG_UNITS[bigUnitIdx]
        }
      }
      lastWasZero = false
    }
  }

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

  const decStr = decPart.toFixed(4).slice(2)
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
  } else {
    result += intToChinese(intPart) + "元"
  }

  const decStr = decToChinese(decPart)
  if (!decStr) {
    result += "整"
  } else {
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