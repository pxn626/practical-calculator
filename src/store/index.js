import Vue from 'vue'
import Vuex from 'vuex'
import history from './history.js'
import theme from './theme.js'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    history,
    theme
  }
})

export default store
