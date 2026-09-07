/**
 * 历史记录 store (Pinia)
 * 持久化:uni.setStorageSync('calc-history', JSON.stringify(state.list))
 */

import { defineStore } from 'pinia'

const STORAGE_KEY = '__calc_history__'
const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', {
  state: () => ({
    list: []
  }),
  actions: {
    init() {
      try {
        const list = uni.getStorageSync(STORAGE_KEY)
        if (list) this.list = JSON.parse(list)
      } catch (e) {
        console.error('history init failed:', e)
      }
    },
    add(entry) {
      const item = {
        id: Date.now(),
        expression: entry.expression,
        result: entry.result,
        timestamp: Date.now()
      }
      this.list.unshift(item)
      if (this.list.length > MAX_HISTORY) {
        this.list = this.list.slice(0, MAX_HISTORY)
      }
      this._save()
    },
    remove(id) {
      this.list = this.list.filter(item => item.id !== id)
      this._save()
    },
    clear() {
      this.list = []
      try {
        uni.removeStorageSync(STORAGE_KEY)
      } catch (e) {
        console.error('history clear failed:', e)
      }
    },
    _save() {
      try {
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(this.list))
      } catch (e) {
        console.error('history save failed:', e)
      }
    }
  }
})
