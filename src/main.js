import Vue from 'vue'
import App from './App'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'

import en from './locales/en.json'
import zh from './locales/zh.json'
import store from './store'

Vue.config.productionTip = false
Vue.use(Vuex)
Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: uni.getSystemInfoSync().language === 'zh-CN' ? 'zh' : 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    zh
  }
})

const app = new Vue({
  i18n,
  store,
  ...App
})
app.$mount()
