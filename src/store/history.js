/**
 * 历史记录 store
 * 持久化:uni.setStorageSync('calc-history', JSON.stringify(state.list))
 */

const STORAGE_KEY = 'calc-history'
const MAX_HISTORY = 50

export default {
  namespaced: true,
  state: {
    list: []
  },
  mutations: {
    init(state) {
      try {
        const list = uni.getStorageSync(STORAGE_KEY)
        if (list) state.list = JSON.parse(list)
      } catch (e) {
        console.error('history init failed:', e)
      }
    },
    add(state, entry) {
      const item = {
        id: Date.now(),
        expression: entry.expression,
        result: entry.result,
        timestamp: Date.now()
      }
      state.list.unshift(item)
      if (state.list.length > MAX_HISTORY) {
        state.list = state.list.slice(0, MAX_HISTORY)
      }
      try {
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(state.list))
      } catch (e) {
        console.error('history save failed:', e)
      }
    },
    remove(state, id) {
      state.list = state.list.filter(item => item.id !== id)
      try {
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(state.list))
      } catch (e) {
        console.error('history save failed:', e)
      }
    },
    clear(state) {
      state.list = []
      try {
        uni.removeStorageSync(STORAGE_KEY)
      } catch (e) {
        console.error('history clear failed:', e)
      }
    }
  },
  actions: {
    add({ commit }, entry) {
      commit('add', entry)
    },
    remove({ commit }, id) {
      commit('remove', id)
    },
    clear({ commit }) {
      commit('clear')
    }
  }
}
