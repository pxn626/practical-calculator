<template>
  <view class="page" :class="{ landscape: isLandscape }">
    <!-- 顶部工具栏 -->
    <view class="toolbar">
      <view class="toolbar-btn" @tap="toggleHistory">
        <text class="iconfont">≡</text>
      </view>
      <view class="toolbar-title">
        <text class="title">{{ $t("app.title") }}</text>
      </view>
      <view class="toolbar-btn" @tap="toggleMode">
        <text class="iconfont">{{ keyMode === "scientific" ? "🔬" : "📱" }}</text>
      </view>
      <view class="toolbar-btn" @tap="toggleTheme">
        <text class="iconfont">{{ themeMode === "dark" ? "☀" : "☾" }}</text>
      </view>
    </view>

    <!-- 显示区域 -->
    <calc-display
      :expression="expression"
      :result="result"
      :capital-text="capitalText"
      :show-capital="showCapital"
    />

    <!-- 历史记录面板 -->
    <history-panel :visible="showHistory" @select="onHistorySelect" />

    <!-- 操作按钮区 (复制/粘贴/大写切换) -->
    <view class="action-bar">
      <view class="action-btn copy-btn" @tap="toggleCopyMenu">
        <text>📋 复制 ▼</text>
      </view>
      <view class="action-btn" @tap="onPaste">
        <text>{{ $t("actions.paste") }}</text>
      </view>
      <view class="action-btn" @tap="onToggleCapital" :class="{ active: showCapital }">
        <text>{{ $t("actions.capitalNumber") }}</text>
      </view>
    </view>

    <!-- 复制子菜单 (复制公式/结果/大写) -->
    <view v-if="showCopyMenu" class="copy-submenu">
      <view class="copy-option" @tap="onCopyFormula">
        <text>复制公式</text>
        <text class="preview">{{ expression || "(空)" }}</text>
      </view>
      <view class="copy-option" @tap="onCopyResult">
        <text>复制结果</text>
        <text class="preview">{{ result }}</text>
      </view>
      <view class="copy-option" @tap="onCopyCapital" :class="{ disabled: !capitalText }">
        <text>复制大写</text>
        <text class="preview">{{ capitalText || "(需开启大写)" }}</text>
      </view>
    </view>

    <!-- 键盘 -->
    <calc-keypad :mode="keyMode" @keytap="onKeyTap" />

    <!-- 底部广告 -->
    <ad-banner />
  </view>
</template>

<script>
import { ref, onMounted } from "vue"
import CalcDisplay from "@/components/calc-display.vue"
import CalcKeypad from "@/components/calc-keypad.vue"
import HistoryPanel from "@/components/history-panel.vue"
import AdBanner from "@/components/ad-banner.vue"
import { evaluate } from "@/utils/calculator.js"
import { toChineseCapital } from "@/utils/toChineseNumber.js"
import { useHistoryStore } from "@/store/history.js"
import { useThemeStore, applyTheme } from "@/store/theme.js"

export default {
  components: {
    CalcDisplay,
    CalcKeypad,
    HistoryPanel,
    AdBanner,
  },
  setup() {
    const expression = ref("")
    const result = ref("0")
    const isLandscape = ref(false)
    const keyMode = ref("standard") // "standard" | "scientific"
    const showHistory = ref(false)
    const showCapital = ref(false)
    const capitalText = ref("")
    const lastWasEquals = ref(false)
    const showCopyMenu = ref(false)

    const historyStore = useHistoryStore()
    const themeStore = useThemeStore()
    const themeMode = themeStore.mode

    const initOrientation = () => {
      // #ifdef H5
      if (typeof window !== "undefined") {
        isLandscape.value = window.innerWidth > window.innerHeight
      }
      // #endif
      // #ifndef H5
      try {
        const sys = uni.getSystemInfoSync()
        isLandscape.value = sys.windowWidth > sys.windowHeight
      } catch (e) {}
      // #endif
    }

    const onResize = () => {
      initOrientation()
    }

    onMounted(() => {
      initOrientation()
      historyStore.init()
      // #ifdef H5
      if (typeof window !== "undefined") {
        window.addEventListener("resize", onResize)
      }
      // #endif
    })

    const toggleHistory = () => {
      showHistory.value = !showHistory.value
    }

    const toggleMode = () => {
      // 手动切换键盘模式(标准 ↔ 科学)
      keyMode.value = keyMode.value === "standard" ? "scientific" : "standard"
    }

    const toggleTheme = () => {
      const next = themeStore.mode === "dark" ? "light" : "dark"
      themeStore.set(next)
      applyTheme(next)
    }

    const preview = () => {
      try {
        const res = evaluate(expression.value)
        if (res !== "Error") {
          result.value = res
        }
      } catch (e) {
        // 表达式不完整时静默
      }
    }

    const clearAll = () => {
      expression.value = ""
      result.value = "0"
      showCapital.value = false
      lastWasEquals.value = false
    }

    const backspace = () => {
      if (expression.value.length > 0) {
        // 删除最后一个字符(支持中文/特殊字符: 用 Array.from 处理 surrogate pairs)
        const chars = Array.from(expression.value)
        chars.pop()
        expression.value = chars.join("")
        
      }
    }

    const toggleSign = () => {
      if (expression.value.startsWith("-")) {
        expression.value = expression.value.slice(1)
      } else {
        expression.value = "-" + expression.value
      }
      preview()
    }

    const appendPercent = () => {
      expression.value += "%"
      
    }

    const appendFactorial = () => {
      expression.value += "!"
      
    }

    const calculate = () => {
      const expr = expression.value
      const res = evaluate(expr)
      result.value = res
      lastWasEquals.value = true

      if (res !== "Error" && expr) {
        historyStore.add({ expression: expr, result: res })
      }

      if (showCapital.value) {
        updateCapital(res)
      }
    }

    const onKeyTap = (value) => {
      switch (value) {
        case "AC":
          clearAll()
          break
        case "DEL":
        case "BS":
        case "←":
          backspace()
          break
        case "sign":
          toggleSign()
          break
        case "%":
          appendPercent()
          break
        case "=":
          calculate()
          break
        case "factorial":
          appendFactorial()
          break
        case "pi":
          expression.value += "π"
          break
        case "e":
          expression.value += "e"
          break
        case "sqrt":
          expression.value += "√("
          break
        case "^":
          // 几次方: 底数 ^ 指数 (需要两个数)
          // 自动加 "^(" 让用户输指数,然后用户手动输 )
          expression.value += "^("
          break
        case "sq":
          // 平方: 直接 ^(2)
          expression.value += "^(2)"
          break
        case "sin":
        case "cos":
        case "tan":
        case "log":
          // 单参数 log(x) = log10(x) (常用对数,中国教科书标准)
          expression.value += "log("
          break
        case "logab":
          // 双参数 log(a, b) = log_a(b) (以 a 为底,b 为真数)
          // append "log(" 开括号,等用户输入: 底数, 真数)
          expression.value += "log("
          break
        case "ln":
          expression.value += "ln("
          break
        case ",":
          expression.value += ","
          break
        default:
          expression.value += value
      }
    }

    // 底层复制函数 (H5 / App 兼容)
    const doCopy = async (text) => {
      if (!text && text !== 0) {
        uni.showToast({ title: "内容为空", icon: "none" })
        return
      }
      const str = String(text)
      try {
        // #ifdef H5
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(str)
          uni.showToast({ title: "已复制", icon: "none" })
          return
        }
        if (typeof document !== "undefined") {
          const ta = document.createElement("textarea")
          ta.value = str
          ta.style.position = "fixed"
          ta.style.left = "-9999px"
          document.body.appendChild(ta)
          ta.select()
          document.execCommand("copy")
          document.body.removeChild(ta)
          uni.showToast({ title: "已复制", icon: "none" })
          return
        }
        // #endif
        uni.setClipboardData({
          data: str,
          success: () => uni.showToast({ title: "已复制", icon: "none" }),
          fail: () => uni.showToast({ title: "复制失败", icon: "none" })
        })
      } catch (e) {
        console.error("copy failed:", e)
        uni.showToast({ title: "复制失败", icon: "none" })
      }
    }

    // 切换复制子菜单
    const toggleCopyMenu = () => {
      showCopyMenu.value = !showCopyMenu.value
      // 计算/打开大写(若需要复制大写)
      if (!capitalText.value && result.value) {
        updateCapital(result.value)
      }
    }

    // 复制公式
    const onCopyFormula = () => {
      doCopy(expression.value)
      showCopyMenu.value = false
    }
    // 复制结果
    const onCopyResult = () => {
      doCopy(result.value)
      showCopyMenu.value = false
    }
    // 复制大写
    const onCopyCapital = () => {
      if (!capitalText.value) {
        uni.showToast({ title: "请先开启大写", icon: "none" })
        return
      }
      doCopy(capitalText.value)
      showCopyMenu.value = false
    }

    // 粘贴: H5 用 navigator.clipboard.readText, App 用 uni API
    const onPaste = async () => {
      try {
        // #ifdef H5
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText()
          insertPasted(text)
          return
        }
        // #endif
        uni.getClipboardData({
          success: (res) => insertPasted(res.data),
          fail: () => uni.showToast({ title: "粘贴失败", icon: "none" })
        })
      } catch (e) {
        console.error("paste failed:", e)
        uni.showToast({ title: "粘贴失败", icon: "none" })
      }
    }

    const insertPasted = (text) => {
      // 清理非数学字符
      const cleaned = String(text || "").replace(/[^0-9.+\-*/÷×−()%π√^!]/g, "")
      if (cleaned) {
        expression.value += cleaned
        preview()
        uni.showToast({ title: "已粘贴", icon: "none" })
      } else {
        uni.showToast({ title: "剪贴板无有效内容", icon: "none" })
      }
    }

    const updateCapital = (value) => {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        capitalText.value = toChineseCapital(num)
      } else {
        capitalText.value = ""
      }
    }

    const onToggleCapital = () => {
      showCapital.value = !showCapital.value
      if (showCapital.value) {
        updateCapital(result.value)
      }
    }

    const onHistorySelect = (item) => {
      expression.value = item.expression
      result.value = item.result
      showHistory.value = false
      lastWasEquals.value = true
    }

    return {
      expression,
      result,
      isLandscape,
      keyMode,
      showHistory,
      showCapital,
      capitalText,
      themeMode,
      toggleHistory,
      toggleMode,
      toggleTheme,
      onKeyTap,
      showCopyMenu,
      toggleCopyMenu,
      onCopyFormula,
      onCopyResult,
      onCopyCapital,
      onPaste,
      onToggleCapital,
      onHistorySelect,
    }
  },
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-primary);
  overflow: hidden;
  position: relative;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: var(--bg-secondary);
  border-bottom: 1rpx solid var(--border-color);
  height: 88rpx;
  box-sizing: border-box;
}

.toolbar-btn {
  width: 80rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: var(--text-primary);
  border-radius: 12rpx;

  &:active {
    background-color: var(--bg-primary);
  }
}

.toolbar-title {
  flex: 1;
  text-align: center;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 12rpx 0;
  background-color: var(--bg-secondary);
  border-bottom: 1rpx solid var(--border-color);
}

.action-btn {
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: var(--key-operator);
  border-radius: 8rpx;

  &:active {
    background-color: var(--bg-primary);
  }

  &.active {
    background-color: var(--key-equals);
    color: var(--key-equals-text);
  }

  &.copy-btn {
    background-color: var(--bg-primary);
    font-weight: 600;
  }
}

.copy-submenu {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  border-bottom: 1rpx solid var(--border-color);
  padding: 8rpx 16rpx;
}

.copy-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  margin: 4rpx 0;
  background-color: var(--bg-primary);
  border-radius: 12rpx;
  font-size: 28rpx;
  color: var(--text-primary);

  &:active {
    opacity: 0.7;
  }

  &.disabled {
    opacity: 0.4;
  }

  .preview {
    font-size: 22rpx;
    color: var(--text-secondary);
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.landscape {
  .toolbar-title {
    .title {
      font-size: 28rpx;
    }
  }
}
</style>
