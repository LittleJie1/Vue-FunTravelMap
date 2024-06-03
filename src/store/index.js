// store/index.js
import { createStore } from 'vuex';

export default createStore({
  state: {
    liffData: null,
  },
  mutations: {
    setLiffData(state, liffData) {
      state.liffData = liffData;
    },
  },
  actions: {
    updateLiffData({ commit }, liffData) {
      commit('setLiffData', liffData);
    },
  },
  getters: {
    getLiffData: state => state.liffData,
  },
});
