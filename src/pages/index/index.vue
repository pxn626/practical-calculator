<template>
  <view class="page" :class="{ 'landscape': isLandscape }">
    <!-- 顶部工具栏 -->
    <view class="toolbar">
      <view class="toolbar-btn" @tap="toggleHistory">
        <text class="iconfont">≡</text>
      </view>
      <view class="toolbar-title">
        <text class="title">{{ $t('app.title') }}</text>
      </view>
      <view class="toolbar-btn" @tap="toggleTheme">
        <text class="iconfont">{{ themeMode === 'dark' ? '☀' : '☾' }}</text>
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
    <history-panel
      :visible="showHistory"
      @select="onHistorySelect"
    />

    <!-- 复制粘贴按钮行 -->
    <view class="action-bar">
      <view class="action-btn" @tap="onCopy">
        <text>{{ $t('actions.copy') }}</text>
      </view>
      <view class="action-btn" @tap="onPaste">
        <text>{{ $t('actions.paste') }}</text>
      </view>
      <view class="action-btn" @tap="onToggleCapital">
        <text>{{ $t('actions.capitalNumber') }}</text>
      </view>
    </view>

    <!-- 键盘 -->
    <calc-keypad
      :mode="isLandscape ? 'scientific' : 'standard'"
      @keytap="onKeyTap"
    />

    <!-- 底部广告 -->
    <ad-banner />
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import CalcDisplay from '@/components/calc-display.vue'
import CalcKeypad from '@/components/calc-keypad.vue'
import HistoryPanel from '@/components/history-panel.vue'
import AdBanner from '@/components/ad-banner.vue'
import { evaluate } from '@/utils/calculator.js'
import { toChineseCapital } from '@/utils/toChineseNumber.js'
import { useHistoryStore } from '@/store/history.js'
import { useThemeStore, applyTheme } from '@/store/theme.js'

export default {
  components: {
    CalcDisplay,
    CalcKeypad,
    HistoryPanel,
    AdBanner
  },
  setup() {
    const expression = ref('')
    const result = ref('0')
    const isLandscape = ref(false)
    const showHistory = ref(false)
    const showCapital = ref(false)
    const capitalText = ref('')
    const lastWasEquals = ref(false)

    const historyStore = useHistoryStore()
    const themeStore = useThemeStore()

    const themeMode = computed(() => themeStore.mode)

    const initOrientation = () => {
      // #ifdef H5
      if (typeof window !== 'undefined') {
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
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', onResize)
      }
      // #endif
    })

    const toggleHistory = () => {
      showHistory.value = !showHistory.value
    }

    const toggleTheme = () => {
      const next = themeStore.mode === 'dark' ? 'light' : 'dark'
      themeStore.set(next)
      applyTheme(next)
    }

    const preview = () => {
      try {
        const res = evaluate(expression.value)
        if (res !== 'Error') {
          result.value = res
        }
      } catch (e) {
        // 表达式不完整时静默
      }
    }

    const clearAll = () => {
      expression.value = ''
      result.value = '0'
      showCapital.value = false
      lastWasEquals.value = false
    }

    const toggleSign = () => {
      if (expression.value.startsWith('-')) {
        expression.value = expression.value.slice(1)
      } else {
        expression.value = '-' + expression.value
      }
      preview()
    }

    const appendPercent = () => {
      expression.value += '%'
      preview()
    }

    const appendFactorial = () => {
      expression.value += '!'
      preview()
    }

    const calculate = () => {
      const expr = expression.value
      const res = evaluate(expr)
      result.value = res
      lastWasEquals.value = true

      if (res !== 'Error' && expr) {
        historyStore.add({ expression: expr, result: res })
      }

      if (showCapital.value) {
        updateCapital(res)
      }
    }

    const onKeyTap = (value) => {
      switch (value) {
        case 'AC':
          clearAll()
          break
        case 'sign':
          toggleSign()
          break
        case '%':
          appendPercent()
          break
        case '=':
          calculate()
          break
        case 'factorial':
          appendFactorial()
          break
        case 'pi':
          expression.value += 'π'
          preview()
          break
        case 'e':
          expression.value += 'e'
          preview()
          break
        case 'sqrt':
          expression.value += '√('
          preview()
          break
        case 'sq':
          expression.value += '^2'
          preview()
          break
        case 'sin':
        case 'cos':
        case 'tan':
        case 'log':
        case 'ln':
          expression.value += value + '('
          preview()
          break
        default:
          expression.value += value
          preview()
      }
    }

    const onCopy = () => {
      uni.setClipboardData({
        data: result.value,
        success: () => {
          uni.showToast({
            title: '已复制',
            icon: 'none'
          })
        }
      })
    }

    const onPaste = () => {
      uni.getClipboardData({
        success: (res) => {
          const cleaned = res.data.replace(/[^0-9.+\-*/÷×−()%π√^!]/g, '')
          if (cleaned) {
            expression.value += cleaned
            preview()
            uni.showToast({
              title: '已粘贴',
              icon: 'none'
            })
          }
        }
      })
    }

    const updateCapital = (value) => {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        capitalText.value = toChineseCapital(num)
      } else {
        capitalText.value = ''
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
      showHistory,
      showCapital,
      capitalText,
      themeMode,
      toggleHistory,
      toggleTheme,
      onKeyTap,
      onCopy,
      onPaste,
      onToggleCapital,
      onHistorySelect
    }
  }
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
}

.landscape {
  .toolbar-title {
    .title {
      font-size: 28rpx;
    }
  }
}
</style>
