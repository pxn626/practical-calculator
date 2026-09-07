import { createSSRApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import App from './App.vue'
import en from './locales/en.json'
import zh from './locales/zh.json'

export function createApp() {
  const app = createSSRApp(App)

  // i18n
  const i18n = createI18n({
    legacy: false,
    locale: uni.getSystemInfoSync().language === 'zh-CN' ? 'zh' : 'en',
    fallbackLocale: 'en',
    messages: { en, zh }
  })
  app.use(i18n)

  // Pinia store
  const pinia = createPinia()
  app.use(pinia)

  return { app }
}
