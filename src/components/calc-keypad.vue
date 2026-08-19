<template>
  <view class="calc-keypad" :class="{ 'scientific': mode === 'scientific' }">
    <!-- 科学计算器面板 (横屏或 unfolded) -->
    <view v-if="mode === 'scientific'" class="scientific-panel">
      <view class="key sci" hover-class="key-active" @tap="onTap('sin')">{{ $t('keypad.sin') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('cos')">{{ $t('keypad.cos') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('tan')">{{ $t('keypad.tan') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('log')">{{ $t('keypad.log') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('ln')">{{ $t('keypad.ln') }}</view>

      <view class="key sci" hover-class="key-active" @tap="onTap('sqrt')">{{ $t('keypad.sqrt') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('sq')">{{ $t('keypad.square') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('^')">{{ $t('keypad.power') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('pi')">{{ $t('keypad.pi') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('e')">{{ $t('keypad.e') }}</view>

      <view class="key sci" hover-class="key-active" @tap="onTap('(')">{{ $t('keypad.open') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap(')')">{{ $t('keypad.close') }}</view>
      <view class="key sci" hover-class="key-active" @tap="onTap('factorial')">{{ $t('keypad.factorial') }}</view>
    </view>

    <!-- 标准键盘 -->
    <view class="keypad-grid">
      <!-- Row 1 -->
      <view class="key func" hover-class="key-active" @tap="onTap('AC')">{{ $t('keypad.clear') }}</view>
      <view class="key func" hover-class="key-active" @tap="onTap('sign')">{{ $t('keypad.sign') }}</view>
      <view class="key func" hover-class="key-active" @tap="onTap('%')">{{ $t('keypad.percent') }}</view>
      <view class="key op" hover-class="key-active" @tap="onTap('÷')">{{ $t('keypad.divide') }}</view>

      <!-- Row 2 -->
      <view class="key num" hover-class="key-active" @tap="onTap('7')">{{ $t('keypad.seven') }}</view>
      <view class="key num" hover-class="key-active" @tap="onTap('8')">{{ $t('keypad.eight') }}</view>
      <view class="key num" hover-class="key-active" @tap="onTap('9')">{{ $t('keypad.nine') }}</view>
      <view class="key op" hover-class="key-active" @tap="onTap('×')">{{ $t('keypad.multiply') }}</view>

      <!-- Row 3 -->
      <view class="key num" hover-class="key-active" @tap="onTap('4')">{{ $t('keypad.four') }}</view>
      <view class="key num" hover-class="key-active" @tap="onTap('5')">{{ $t('keypad.five') }}</view>
      <view class="key num" hover-class="key-active" @tap="onTap('6')">{{ $t('keypad.six') }}</view>
      <view class="key op" hover-class="key-active" @tap="onTap('−')">{{ $t('keypad.subtract') }}</view>

      <!-- Row 4 -->
      <view class="key num" hover-class="key-active" @tap="onTap('1')">{{ $t('keypad.one') }}</view>
      <view class="key num" hover-class="key-active" @tap="onTap('2')">{{ $t('keypad.two') }}</view>
      <view class="key num" hover-class="key-active" @tap="onTap('3')">{{ $t('keypad.three') }}</view>
      <view class="key op" hover-class="key-active" @tap="onTap('+')">{{ $t('keypad.add') }}</view>

      <!-- Row 5 -->
      <view class="key num zero" hover-class="key-active" @tap="onTap('0')">{{ $t('keypad.zero') }}</view>
      <view class="key num" hover-class="key-active" @tap="onTap('.')">{{ $t('keypad.decimal') }}</view>
      <view class="key equals" hover-class="key-active" @tap="onTap('=')">{{ $t('keypad.equals') }}</view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'calc-keypad',
  props: {
    mode: {
      type: String,
      default: 'standard' // 'standard' | 'scientific'
    }
  },
  methods: {
    onTap(value) {
      this.$emit('keytap', value)
    }
  }
}
</script>

<style lang="scss" scoped>
.calc-keypad {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--bg-secondary);
  padding: 8rpx;
  box-sizing: border-box;
}

.scientific-panel {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 8rpx;
  margin-bottom: 8rpx;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 8rpx;
  flex: 1;
}

.key {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100rpx;
  border-radius: 16rpx;
  font-size: 36rpx;
  font-weight: 500;
  transition: all 0.1s ease;
  user-select: none;

  &.key-active {
    transform: scale(0.95);
    opacity: 0.8;
  }

  &.num {
    background-color: var(--key-number);
    color: var(--key-number-text);
  }

  &.func {
    background-color: var(--key-function);
    color: var(--key-function-text);
  }

  &.op {
    background-color: var(--key-operator);
    color: var(--key-operator-text);
    font-size: 40rpx;
  }

  &.equals {
    background-color: var(--key-equals);
    color: var(--key-equals-text);
    font-size: 40rpx;
  }

  &.sci {
    background-color: var(--key-function);
    color: var(--key-function-text);
    font-size: 28rpx;
  }

  &.zero {
    grid-column: span 1;
  }
}
</style>
