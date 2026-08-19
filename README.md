# Practical Calculator / 实用计算器

> 双语科学计算器 App,基于 uni-app + Vue 2。覆盖 11 端(微信/抖音/支付宝/百度小程序 + H5 + Amazon/Samsung/Huawei/Xiaomi/OPPO/vivo 海外应用市场)。

## 核心功能(P0 — 8 项)

1. ✅ 标准计算器(+/-/×/÷)
2. ✅ 科学计算器(sin/cos/tan/log/ln/√/x²/x^y/π/e/n!/( ))
3. ✅ 深色 / 浅色模式
4. ✅ 横屏 / 竖屏切换(横屏自动展开科学计算器)
5. ✅ 历史记录(localStorage 持久化)
6. ✅ 大写转换(数字 → 中文大写,人民币大写)
7. ✅ 复制 / 粘贴
8. ✅ 再编辑(表达式光标可拖动)

## P1 后期(暂不实现)

- 语音播报
- 公式运算

## 技术栈

- **框架:** uni-app(基于 Vue 2)
- **数学库:** math.js
- **状态管理:** Vuex
- **国际化:** vue-i18n(英 + 中双语)
- **样式:** SCSS + CSS Variables(深色模式)

## 项目结构

```
practical-calculator/
├── src/
│   ├── App.vue              # 应用入口
│   ├── main.js              # 主入口
│   ├── pages/
│   │   └── index/index.vue  # 主计算器页面
│   ├── components/
│   │   ├── calc-keypad.vue  # 键盘组件
│   │   ├── calc-display.vue # 显示组件
│   │   ├── history-panel.vue # 历史记录
│   │   └── ad-banner.vue    # 广告 Banner
│   ├── utils/
│   │   ├── calculator.js    # 计算引擎
│   │   └── toChineseNumber.js # 大写转换
│   ├── store/
│   │   ├── index.js
│   │   ├── history.js       # 历史记录
│   │   └── theme.js         # 主题
│   ├── locales/
│   │   ├── en.json
│   │   └── zh.json
│   └── static/
│       └── icons/
├── manifest.json
├── pages.json
└── package.json
```

## 开发

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 运行
```bash
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5

# Android App
npm run dev:app-android
```

### 构建
```bash
# 微信小程序(上传审核)
npm run build:mp-weixin

# Android(生成 APK)
npm run build:app-android
```

## 上架清单

### 国内(5 端 P0)
- 微信小程序(个人主体)
- 抖音小程序
- 支付宝小程序
- 百度小程序
- H5

### 海外(6 端 P0)
- Amazon Appstore
- Samsung Galaxy Store
- Huawei AppGallery(国际)
- Xiaomi GetApps(国际)
- OPPO Software Store(国际)
- vivo App Store(国际)

### 阻塞项
- 海外应用市场账号实名信息(阿南 本人护照/身份证)

## 微创新

| 维度 | 原版 | 我们的版本 |
|---|---|---|
| 商业模式 | 无广告 | AdMob / uni-ad 广告 |
| 语言 | 仅中文 | 双语(英+中,设备自动切换) |
| 多端 | 仅华为 | 11 端覆盖 |
| 配色 | 绿粉渐变 | 深蓝+橙色 |

## 拆解报告

详见 `../knowledge/luobiyun-project/market-research/practical-calculator-analysis.md`

## License

MIT
