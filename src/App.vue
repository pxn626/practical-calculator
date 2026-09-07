<script>
import { initTheme } from './store/theme.js'

export default {
  onLaunch: function() {
    console.log('App Launch')
    initTheme()
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 全局样式 - 深色模式 CSS variables */
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-display: #1E3A5F;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-display: #FFFFFF;
  --key-number: #FFFFFF;
  --key-number-text: #1A1A1A;
  --key-operator: #FF9500;
  --key-operator-text: #FFFFFF;
  --key-function: #E0E0E0;
  --key-function-text: #1A1A1A;
  --key-equals: #FF9500;
  --key-equals-text: #FFFFFF;
  --border-color: #DDDDDD;
}

[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2A2A2A;
  --bg-display: #0A1929;
  --text-primary: #FFFFFF;
  --text-secondary: #AAAAAA;
  --text-display: #FFFFFF;
  --key-number: #2A2A2A;
  --key-number-text: #FFFFFF;
  --key-operator: #FF9500;
  --key-operator-text: #FFFFFF;
  --key-function: #404040;
  --key-function-text: #FFFFFF;
  --key-equals: #FF9500;
  --key-equals-text: #FFFFFF;
  --border-color: #404040;
}

page {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Unicode 范围兼容图标 */
@font-face {
  font-family: 'calc-icon';
  src: url('https://at.alicdn.com/t/font_xxxxxx.ttf') format('truetype');
}
</style>
