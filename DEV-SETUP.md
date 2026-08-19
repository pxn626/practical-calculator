# 实用计算器 - 开发指南

## 方案选择

### 方案 A(推荐):Windows HBuilderX + VSCode(纯轻量)
适合:不想装大型 IDE,追求快速上手

```bash
# 1. clone 到本地
git clone git@github.com:pxn626/practical-calculator.git
cd practical-calculator

# 2. 安装依赖
npm install

# 3. H5 预览
npm run dev:h5
# 浏览器打开: http://localhost:5173

# 4. 微信小程序预览(需要微信开发者工具)
npm run dev:mp-weixin
# 微信开发者工具 → 导入 → 选择 practical-calculator/unpackage/dist/dev/mp-weixin
```

### 方案 B:纯 VSCode(无 HBuilderX)
适合:Linux 开发或不用 HBuilderX

```bash
# 安装 VSCode
# 安装插件:uni-helper / Vue - Official / ESLint

# clone + install + run
git clone git@github.com:pxn626/practical-calculator.git
cd practical-calculator
npm install
npm run dev:h5
```

## 开发命令

```bash
npm run dev:h5          # H5 开发服务器 (localhost:5173)
npm run dev:mp-weixin   # 微信小程序
npm run dev:mp-alipay   # 支付宝小程序
npm run dev:mp-baidu    # 百度小程序
npm run dev:mp-toutiao  # 抖音小程序
npm run dev:app-android # Android App (需要 Android Studio)

npm run build:h5        # H5 生产构建
npm run build:mp-weixin # 微信小程序上传
```

## 目录结构

```
practical-calculator/
├── src/
│   ├── manifest.json     # App 配置(包名/权限/广告)
│   ├── pages.json        # 页面路由
│   ├── App.vue           # 全局样式(CSS variables 深色模式)
│   ├── main.js           # 入口
│   ├── uni.scss          # 全局 SCSS
│   ├── pages/
│   │   └── index/index.vue  # 主计算器页面
│   ├── components/
│   │   ├── calc-keypad.vue    # 键盘组件
│   │   ├── calc-display.vue   # 显示组件
│   │   ├── history-panel.vue  # 历史记录
│   │   └── ad-banner.vue      # 广告 Banner
│   ├── utils/
│   │   ├── calculator.js      # math.js 计算引擎
│   │   └── toChineseNumber.js # 中文大写
│   ├── store/
│   │   ├── history.js    # 历史记录(Pinia)
│   │   └── theme.js      # 主题(Pinia)
│   └── locales/
│       ├── en.json       # 英语
│       └── zh.json       # 中文
├── package.json
└── vite.config.js
```

## 技术栈

- **uni-app 3.0** (Vue 3 + Vite 5)
- **Pinia** 状态管理
- **vue-i18n 9** 国际化
- **math.js** 科学计算

## 遇到问题?

1. `npm install` 失败 → 检查 Node 版本(需 18+): `node -v`
2. `npm run dev:h5` 报错 → 删除 `node_modules` 重装: `rm -rf node_modules && npm install`
3. 微信开发者工具打不开 → 更新到最新版
