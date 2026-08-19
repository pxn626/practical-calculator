<template>
  <view class="calc-display">
    <!-- 历史表达式显示 -->
    <scroll-view scroll-x class="expression" :scroll-into-view="expressionView">
      <text class="expression-text" :id="expressionId">{{ expression || ' ' }}</text>
    </scroll-view>

    <!-- 当前结果显示 -->
    <view class="result-row">
      <view class="result-display">
        <scroll-view scroll-x class="result-scroll" :scroll-into-view="resultView">
          <text class="result-text" :id="resultId">{{ result }}</text>
        </scroll-view>
      </view>
      <view v-if="showCapital" class="capital-display">
        {{ capitalText }}
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'calc-display',
  props: {
    expression: {
      type: String,
      default: ''
    },
    result: {
      type: String,
      default: '0'
    },
    capitalText: {
      type: String,
      default: ''
    },
    showCapital: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    expressionId() {
      return 'expr-' + Date.now()
    },
    resultId() {
      return 'res-' + Date.now()
    },
    expressionView() {
      return this.expressionId
    },
    resultView() {
      return this.resultId
    }
  }
}
</script>

<style lang="scss" scoped>
.calc-display {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-display);
  padding: 40rpx 30rpx;
  min-height: 240rpx;
  box-sizing: border-box;
}

.expression {
  width: 100%;
  height: 50rpx;
  white-space: nowrap;
  margin-bottom: 16rpx;
}

.expression-text {
  display: inline-block;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Courier New', monospace;
}

.result-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.result-display {
  width: 100%;
  overflow: hidden;
}

.result-scroll {
  width: 100%;
  white-space: nowrap;
  text-align: right;
}

.result-text {
  display: inline-block;
  font-size: 72rpx;
  color: var(--text-display);
  font-weight: 300;
  font-family: 'Courier New', monospace;
  line-height: 1.2;
}

.capital-display {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  text-align: right;
  width: 100%;
}
</style>
