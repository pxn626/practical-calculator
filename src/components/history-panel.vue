<template>
  <view class="history-panel" v-if="visible">
    <view class="history-header">
      <text class="history-title">{{ $t('actions.history') }}</text>
      <view class="history-clear" @tap="onClear">
        <text>{{ $t('actions.clearHistory') }}</text>
      </view>
    </view>
    <scroll-view class="history-list" scroll-y>
      <view v-if="list.length === 0" class="history-empty">
        <text>No history</text>
      </view>
      <view v-for="item in list" :key="item.id" class="history-item" @tap="onSelect(item)">
        <view class="history-item-expr">{{ item.expression }}</view>
        <view class="history-item-res">= {{ item.result }}</view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'history-panel',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState('history', ['list'])
  },
  methods: {
    ...mapActions('history', ['clear']),
    onClear() {
      this.clear()
    },
    onSelect(item) {
      this.$emit('select', item)
    }
  }
}
</script>

<style lang="scss" scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  border-top: 1rpx solid var(--border-color);
  max-height: 400rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color);
}

.history-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.history-clear {
  padding: 8rpx 16rpx;
  font-size: 24rpx;
  color: var(--key-operator);
}

.history-list {
  flex: 1;
  max-height: 320rpx;
}

.history-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  color: var(--text-secondary);
  font-size: 28rpx;
}

.history-item {
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color);

  &:active {
    background-color: var(--bg-primary);
  }
}

.history-item-expr {
  font-size: 28rpx;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
  margin-bottom: 8rpx;
}

.history-item-res {
  font-size: 36rpx;
  color: var(--text-primary);
  font-weight: 500;
  font-family: 'Courier New', monospace;
}
</style>
