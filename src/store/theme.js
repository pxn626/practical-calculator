/**
 * 主题 store
 * 支持:light / dark / system (跟随系统)
 */

const STORAGE_KEY = 'calc-theme'

export default {
  namespaced: true,
  state: {
    mode: 'system' // 'light' | 'dark' | 'system'
  },
  mutations: {
    init(state) {
      try {
        const mode = uni.getStorageSync(STORAGE_KEY)
        if (mode) state.mode = mode
      } catch (e) {
        console.error('theme init failed:', e)
      }
    },
    set(state, mode) {
      state.mode = mode
      try {
        uni.setStorageSync(STORAGE_KEY, mode)
      } catch (e) {
        console.error('theme save failed:', e)
      }
    }
  },
  actions: {
    set({ commit }, mode) {
      commit('set', mode)
    }
  }
}

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
