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
import CalcDisplay from '@/components/calc-display.vue'
import CalcKeypad from '@/components/calc-keypad.vue'
import HistoryPanel from '@/components/history-panel.vue'
import AdBanner from '@/components/ad-banner.vue'
import { evaluate, factorial } from '@/utils/calculator.js'
import { toChineseCapital } from '@/utils/toChineseNumber.js'
import { mapState, mapActions, mapMutations } from 'vuex'
import { applyTheme } from '@/store/theme.js'

export default {
  components: {
    CalcDisplay,
    CalcKeypad,
    HistoryPanel,
    AdBanner
  },
  data() {
    return {
      expression: '',
      result: '0',
      isLandscape: false,
      showHistory: false,
      showCapital: false,
      capitalText: '',
      lastWasEquals: false
    }
  },
  computed: {
    ...mapState('theme', ['mode']),
    themeMode() {
      return this.mode
    }
  },
  onLoad() {
    this.initOrientation()
    this.initHistory()
    // 监听屏幕旋转
    uni.onWindowResize && uni.onWindowResize(this.onResize)
    // #ifdef H5
    window.addEventListener('resize', this.onResize)
    // #endif
  },
  onUnload() {
    uni.offWindowResize && uni.offWindowResize(this.onResize)
    // #ifdef H5
    window.removeEventListener('resize', this.onResize)
    // #endif
  },
  methods: {
    ...mapMutations('history', ['init']),
    ...mapActions('history', ['add']),

    initOrientation() {
      // #ifdef H5
      this.isLandscape = window.innerWidth > window.innerHeight
      // #endif
      // #ifndef H5
      const sys = uni.getSystemInfoSync()
      this.isLandscape = sys.windowWidth > sys.windowHeight
      // #endif
    },

    onResize() {
      this.initOrientation()
    },

    initHistory() {
      this.init()
    },

    toggleHistory() {
      this.showHistory = !this.showHistory
    },

    toggleTheme() {
      const next = this.mode === 'dark' ? 'light' : 'dark'
      this.$store.dispatch('theme/set', next)
      applyTheme(next)
    },

    onKeyTap(value) {
      switch (value) {
        case 'AC':
          this.clearAll()
          break
        case 'sign':
          this.toggleSign()
          break
        case '%':
          this.appendPercent()
          break
        case '=':
          this.calculate()
          break
        case 'factorial':
          this.appendFactorial()
          break
        case 'pi':
          this.expression += 'π'
          this.preview()
          break
        case 'e':
          this.expression += 'e'
          this.preview()
          break
        case 'sqrt':
          this.expression += '√('
          this.preview()
          break
        case 'sq':
          this.expression += '^2'
          this.preview()
          break
        case 'sin':
        case 'cos':
        case 'tan':
        case 'log':
        case 'ln':
          this.expression += value + '('
          this.preview()
          break
        default:
          this.expression += value
          this.preview()
      }
    },

    clearAll() {
      this.expression = ''
      this.result = '0'
      this.showCapital = false
      this.lastWasEquals = false
    },

    toggleSign() {
      if (this.expression.startsWith('-')) {
        this.expression = this.expression.slice(1)
      } else {
        this.expression = '-' + this.expression
      }
      this.preview()
    },

    appendPercent() {
      this.expression += '%'
      this.preview()
    },

    appendFactorial() {
      this.expression += '!'
      this.preview()
    },

    preview() {
      // 实时预览（不保存到历史）
      try {
        const result = evaluate(this.expression)
        if (result !== 'Error') {
          this.result = result
        }
      } catch (e) {
        // 表达式不完整时静默
      }
    },

    calculate() {
      const expr = this.expression
      const result = evaluate(expr)
      this.result = result
      this.lastWasEquals = true

      // 保存到历史
      if (result !== 'Error' && expr) {
        this.add({ expression: expr, result })
      }

      // 更新大写显示
      if (this.showCapital) {
        this.updateCapital(result)
      }
    },

    onCopy() {
      uni.setClipboardData({
        data: this.result,
        success: () => {
          uni.showToast({
            title: this.$t('actions.copySuccess'),
            icon: 'none'
          })
        }
      })
    },

    onPaste() {
      uni.getClipboardData({
        success: (res) => {
          // 简单粘贴 - 过滤非数字字符
          const cleaned = res.data.replace(/[^0-9.+\-*/÷×−()%π√^!]/g, '')
          if (cleaned) {
            this.expression += cleaned
            this.preview()
            uni.showToast({
              title: this.$t('actions.pasteSuccess'),
              icon: 'none'
            })
          }
        }
      })
    },

    onToggleCapital() {
      this.showCapital = !this.showCapital
      if (this.showCapital) {
        this.updateCapital(this.result)
      }
    },

    updateCapital(value) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        this.capitalText = toChineseCapital(num)
      } else {
        this.capitalText = ''
      }
    },

    onHistorySelect(item) {
      this.expression = item.expression
      this.result = item.result
      this.showHistory = false
      this.lastWasEquals = true
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
