/**
 * 主题 store (Pinia)
 * 支持:light / dark / system (跟随系统)
 */

import { defineStore } from 'pinia'

const STORAGE_KEY = '__calc_theme_mode__'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: 'system' // 'light' | 'dark' | 'system'
  }),
  actions: {
    init() {
      try {
        const mode = uni.getStorageSync(STORAGE_KEY)
        if (mode) this.mode = mode
      } catch (e) {
        console.error('theme init failed:', e)
      }
    },
    set(mode) {
      this.mode = mode
      try {
        uni.setStorageSync(STORAGE_KEY, mode)
      } catch (e) {
        console.error('theme save failed:', e)
      }
    }
  }
})

/**
 * 初始化主题应用
 */
export function initTheme() {
  try {
    const mode = uni.getStorageSync(STORAGE_KEY) || 'system'
    applyTheme(mode)
  } catch (e) {
    console.error('initTheme failed:', e)
  }
}

/**
 * 应用主题到 document
 */
export function applyTheme(mode) {
  let effective = mode
  if (mode === 'system') {
    effective = uni.getSystemInfoSync().theme === 'dark' ? 'dark' : 'light'
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', effective)
  }
}
