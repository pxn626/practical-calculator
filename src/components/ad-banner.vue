<template>
  <view class="ad-banner">
    <!-- 微信小程序广告位 -->
    <!-- <ad unit-id="adunit-xxxxxxxxxxxx" ad-type="banner" @load="onAdLoad" @error="onAdError"></ad> -->

    <!-- 其他平台广告占位 - 通过条件编译实现 -->
    <!-- #ifdef APP-PLUS -->
    <view class="ad-placeholder">
      <text class="ad-text">AdMob Banner Placeholder</text>
    </view>
    <!-- #endif -->

    <!-- #ifdef H5 -->
    <view class="ad-placeholder">
      <text class="ad-text">H5 Ad Placeholder</text>
    </view>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  name: 'ad-banner',
  methods: {
    onAdLoad(e) {
      console.log('ad loaded:', e)
    },
    onAdError(e) {
      console.error('ad error:', e)
    }
  }
}
</script>

<style lang="scss" scoped>
.ad-banner {
  width: 100%;
  padding: 16rpx 0;
  background-color: var(--bg-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120rpx;
}

.ad-placeholder {
  width: 100%;
  height: 100rpx;
  background-color: rgba(0, 0, 0, 0.05);
  border: 2rpx dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
}

.ad-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}
</style>
